import { curve } from 'elliptic'

// For ESM compatibility
import pkg from 'elliptic'
const { ec } = pkg

import { BeeError } from '../utils/error.js'
import { Bytes, isBytes, assertBytes, wrapBytesWithHelpers } from '../utils/bytes.js'
import { keccak256Hash } from '../utils/hash.js'
import { hexToBytes, makeHexString } from '../utils/hex.js'
import { EthAddress } from '../utils/eth.js'
import {
  Data,
  PrivateKeyBytes,
  Signature,
  SIGNATURE_BYTES_LENGTH,
  SIGNATURE_HEX_LENGTH,
  Signer,
} from '../types/index.js'
import { isStrictlyObject } from '../utils/type.js'

type EllipticPublicKey = curve.base.BasePoint
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
export function defaultSign(data: Uint8Array, privateKey: PrivateKeyBytes): Signature {
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
 * Creates a singer object that can be used when the private key is known.
 *
 * @param privateKey The private key
 */
export function makePrivateKeySigner(privateKey: PrivateKeyBytes): Signer {
  const curve = new ec('secp256k1')
  const keyPair = curve.keyFromPrivate(privateKey)
  const address = publicKeyToAddress(keyPair.getPublic())

  return {
    sign: (digest: Data) => defaultSign(digest, privateKey),
    address,
  }
}

export function assertSigner(signer: unknown): asserts signer is Signer {
  if (!isStrictlyObject(signer)) {
    throw new TypeError('Signer must be an object!')
  }

  const typedSigner = signer as Signer

  if (!isBytes(typedSigner.address, 20)) {
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

    return makePrivateKeySigner(keyBytes)
  } else if (signer instanceof Uint8Array) {
    assertBytes(signer, 32)

    return makePrivateKeySigner(signer)
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
    assertBytes(result, SIGNATURE_BYTES_LENGTH)

    return result
  }

  throw new TypeError('Invalid output of sign function!')
}
