import { ec, curve } from 'elliptic'
import { BeeError } from '../utils/error'
import type { Bytes } from './bytes'
import { keccak256Hash } from './hash'

export type Signature = Bytes<65>
export type PrivateKey = Bytes<32>
export type PublicKey = Bytes<32> | Bytes<64>
export type EthAddress = Bytes<20>

type SyncSigner = (digest: Uint8Array) => Signature
type AsyncSigner = (digest: Uint8Array) => Promise<Signature>

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

export function sign(data: Uint8Array, signer: Signer): Signature | Promise<Signature> {
  const hash = hashWithEthereumPrefix(data)

  return signer.sign(hash)
}

export function signCompact(digest: Uint8Array, privateKey: PrivateKey): Signature {
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

export function makeDefaultSigner(privateKey: PrivateKey): Signer {
  const curve = new ec('secp256k1')
  const keyPair = curve.keyFromPrivate(privateKey)
  const address = publicKeyToAddress(keyPair.getPublic())

  return {
    sign: (digest: Uint8Array) => signCompact(digest, privateKey),
    address,
  }
}
