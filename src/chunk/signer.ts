import { ec, curve } from 'elliptic'
import { BeeError } from '../utils/error'
import { Bytes, verifyBytes } from '../utils/bytes'
import { keccak256Hash } from './hash'
import { hexToBytes, verifyHex } from '../utils/hex'
import { EthAddress } from '../utils/eth'

/**
 * Ethereum compatible signing and recovery
 */

export type Signature = Bytes<65>
export type PrivateKey = Bytes<32>
export type PublicKey = Bytes<32> | Bytes<64>

type SyncSigner = (digest: Uint8Array) => Signature
type AsyncSigner = (digest: Uint8Array) => Promise<Signature>

/**
 * Interface for implementing Ethereum compatible signing.
 *
 * In order to be compatible with Ethereum and its signing method `personal_sign`, the data
 * that are passed to sign() function should be prefixed with: `\x19Ethereum Signed Message:\n${data.length}`, hashed
 * and only then signed.
 * If you are wrapping another signer tool/library (like Metamask or some other Ethereum wallet), you might not have
 * to do this prefixing manually if you use the `personal_sign` method. Check documentation of the tool!
 * If you are writing your own storage for keys, then you have to prefix the data manually otherwise the Bee node
 * will reject the chunk!
 *
 * For example see the hashWithEthereumPrefix() function.
 *
 * @property sign     The sign function that can be sync or async. This function takes non-prefixed data. See above.
 * @property address  The ethereum address of the signer
 * @see hashWithEthereumPrefix
 */
export type Signer = {
  sign: SyncSigner | AsyncSigner
  address: EthAddress
}

const UNCOMPRESSED_RECOVERY_ID = 27

function hashWithEthereumPrefix(data: Uint8Array): Bytes<32> {
  const ethereumSignedMessagePrefix = `\x19Ethereum Signed Message:\n${data.length}`
  const prefixBytes = new TextEncoder().encode(ethereumSignedMessagePrefix)

  return keccak256Hash(prefixBytes, data)
}

/**
 * The default signer function that can be used for integrating with
 * other applications (e.g. wallets).
 *
 * @param data      The data to be signed
 * @param privateKey  The private key used for signing the data
 */
export function defaultSign(data: Uint8Array, privateKey: PrivateKey): Signature {
  const curve = new ec('secp256k1')
  const keyPair = curve.keyFromPrivate(privateKey)

  const hashedDigest = hashWithEthereumPrefix(data)
  const sigRaw = curve.sign(hashedDigest, keyPair, { canonical: true, pers: undefined })

  if (sigRaw.recoveryParam === null) {
    throw new BeeError('signDigest recovery param was null')
  }
  const signature = new Uint8Array([
    ...sigRaw.r.toArray('be', 32),
    ...sigRaw.s.toArray('be', 32),
    sigRaw.recoveryParam + UNCOMPRESSED_RECOVERY_ID,
  ])

  return signature as Signature
}

type EllipticPublicKey = curve.base.BasePoint

function publicKeyToAddress(pubKey: EllipticPublicKey): EthAddress {
  const pubBytes = pubKey.encode('array', false)

  return keccak256Hash(pubBytes.slice(1)).slice(12) as EthAddress
}

/**
 * Recovers the ethereum address from a given signature.
 *
 * Can be used for verifying a piece of data when the public key is
 * known.
 *
 * @param signature The signature
 * @param digest    The digest of the data
 *
 * @returns the recovered address
 */
export function recoverAddress(signature: Signature, digest: Uint8Array): EthAddress {
  const curve = new ec('secp256k1')
  const sig = {
    r: signature.slice(0, 32),
    s: signature.slice(32, 64),
  }
  const recoveryParam = signature[64] - UNCOMPRESSED_RECOVERY_ID
  const hash = hashWithEthereumPrefix(digest)
  const recPubKey = curve.recoverPubKey(hash, sig, recoveryParam)

  return publicKeyToAddress(recPubKey)
}

/**
 * Creates a default singer object that can be used when the private
 * key is known.
 *
 * @param privateKey The private key
 */
export function makeDefaultSigner(privateKey: PrivateKey): Signer {
  const curve = new ec('secp256k1')
  const keyPair = curve.keyFromPrivate(privateKey)
  const address = publicKeyToAddress(keyPair.getPublic())

  return {
    sign: (digest: Uint8Array) => defaultSign(digest, privateKey),
    address,
  }
}

export function isSigner(signer: unknown): signer is Signer {
  return typeof signer === 'object' && signer !== null && 'sign' in signer && 'address' in signer
}

export function makeSigner(signer: Signer | Uint8Array | string | unknown): Signer {
  if (typeof signer === 'string') {
    const hexKey = verifyHex(signer)
    const keyBytes = hexToBytes(hexKey)
    const verifiedPrivateKey = verifyBytes(32, keyBytes)

    return makeDefaultSigner(verifiedPrivateKey)
  } else if (signer instanceof Uint8Array) {
    const verifiedPrivateKey = verifyBytes(32, signer)

    return makeDefaultSigner(verifiedPrivateKey)
  } else if (isSigner(signer)) {
    return signer
  }
  throw TypeError('invalid signer')
}
