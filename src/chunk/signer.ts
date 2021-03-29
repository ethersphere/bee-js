import { ec, curve } from 'elliptic'
import { BeeError } from '../utils/error'
import { Bytes, isBytes, verifyBytes, wrapBytesWithHelpers } from '../utils/bytes'
import { keccak256Hash } from './hash'
import { HexString, hexToBytes, makeHexString } from '../utils/hex'
import { EthAddress } from '../utils/eth'
import { Data } from '../types'

/**
 * Ethereum compatible signing and recovery
 */
const SIGNATURE_HEX_LENGTH = 130
const SIGNATURE_BYTES_LENGTH = 65

export type Signature = Bytes<typeof SIGNATURE_BYTES_LENGTH>
export type PrivateKey = Bytes<32>
export type PublicKey = Bytes<32> | Bytes<64>

/**
 * Signing function that takes digest in Uint8Array  to be signed that has helpers to convert it
 * conveniently into other types like hex-string (non prefix).
 * Result of the signing can be returned either in Uint8Array or hex string form.
 *
 * @see Data
 */
type SyncSigner = (digest: Data) => Signature | HexString<typeof SIGNATURE_HEX_LENGTH> | string
type AsyncSigner = (digest: Data) => Promise<Signature | HexString<typeof SIGNATURE_HEX_LENGTH> | string>
type EllipticPublicKey = curve.base.BasePoint

/**
 * Interface for implementing Ethereum compatible signing.
 *
 * In order to be compatible with Ethereum and its signing method `personal_sign`, the data
 * that are passed to sign() function should be prefixed with: `\x19Ethereum Signed Message:\n${data.length}`, hashed
 * and only then signed.
 * If you are wrapping another signer tool/library (like Metamask or some other Ethereum wallet), you might not have
 * to do this prefixing manually if you use the `personal_sign` method. Check documentation of the tool!
 * If you are writing your own storage for keys, then you have to prefix the data manually otherwise the Bee node
 * will reject the chunks signed by you!
 *
 * For example see the hashWithEthereumPrefix() function.
 *
 * @property sign     The sign function that can be sync or async. This function takes non-prefixed data. See above.
 * @property address  The ethereum address of the signer in bytes.
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
    sign: (digest: Data) => defaultSign(digest, privateKey),
    address,
  }
}

export function assertSigner(signer: unknown): asserts signer is Signer {
  if (typeof signer !== 'object' || signer === null) {
    throw new TypeError('Signer must be an object or string!')
  }

  const typedSigner = signer as Signer

  if (!isBytes(20, typedSigner.address)) {
    throw new TypeError("Signer's address must be Uint8Array with 20 bytes!")
  }

  if (typeof typedSigner.sign !== 'function') {
    throw new TypeError('Signer sign property needs to be function!')
  }
}

export function makeSigner(signer: Signer | Uint8Array | string | unknown): Signer {
  if (typeof signer === 'string') {
    const hexKey = makeHexString(signer, 64)
    const keyBytes = hexToBytes<32>(hexKey) // HexString is verified for 64 length => 32 is guaranteed

    return makeDefaultSigner(keyBytes)
  } else if (signer instanceof Uint8Array) {
    const verifiedPrivateKey = verifyBytes(32, signer)

    return makeDefaultSigner(verifiedPrivateKey)
  }

  assertSigner(signer)

  return signer
}

export async function sign(signer: Signer, data: Uint8Array): Promise<Signature> {
  const result = await signer.sign(wrapBytesWithHelpers(data))

  if (typeof result === 'string') {
    const hexString = makeHexString(result, SIGNATURE_HEX_LENGTH)

    return hexToBytes<65>(hexString)
  }

  if (result instanceof Uint8Array) {
    verifyBytes(SIGNATURE_BYTES_LENGTH, result)

    return result
  }

  throw new TypeError('Invalid output of sign function!')
}
