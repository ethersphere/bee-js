import { ec, curve } from 'elliptic'
import { BeeError } from '../utils/error'
import { Bytes, verifyBytes } from '../utils/bytes'
import { keccak256Hash } from './hash'
import { hexToBytes, verifyHex } from '../utils/hex'

/**
 * Ethereum compatible signing and recovery
 */

export type Signature = Bytes<65>
export type PrivateKey = Bytes<32>
export type PublicKey = Bytes<32> | Bytes<64>
export type EthAddress = Bytes<20>

type SyncSigner = (digest: Uint8Array) => Signature
type AsyncSigner = (digest: Uint8Array) => Promise<Signature>

/**
 * Interface for implementing Ethereum compatible signing.
 *
 * @property sign     The sign function that can be sync or async
 * @property address  The ethereum address of the signer
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
 * Sign the data with a signer.
 *
 * Adds the ethereum prefix to the data before signing.
 *
 * @param data    The data to be signed
 * @param signer  The signer used for signing
 *
 * @returns the signature
 */
export function sign(data: Uint8Array, signer: Signer): Signature | Promise<Signature> {
  const hash = hashWithEthereumPrefix(data)

  return signer.sign(hash)
}

/**
 * The default signer function that can be used for integrating with
 * other applications (e.g. wallets).
 *
 * @param digest      The data to be signed
 * @param privateKey  The private key used for signing the data
 */
export function defaultSign(digest: Uint8Array, privateKey: PrivateKey): Signature {
  const curve = new ec('secp256k1')
  const keyPair = curve.keyFromPrivate(privateKey)
  const sigRaw = curve.sign(digest, keyPair, { canonical: true, pers: undefined })

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

export function verifySigner(signer: Signer | PrivateKey | string): Signer {
  if (typeof signer === 'string') {
    const hexKey = verifyHex(signer)
    const keyBytes = hexToBytes(hexKey)
    const verifiedPrivateKey = verifyBytes(32, keyBytes)

    return makeDefaultSigner(verifiedPrivateKey)
  } else if (signer instanceof Uint8Array) {
    const verifiedPrivateKey = verifyBytes(32, signer)

    return makeDefaultSigner(verifiedPrivateKey)
  }

  return signer
}
