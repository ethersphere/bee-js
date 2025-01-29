import { Binary } from 'cafe-utility'
import { Bytes } from './bytes'
import { Reference } from './typed-bytes'

export const SWARM_MANIFEST_CODEC = 0xfa
export const SWARM_FEED_CODEC = 0xfb

const CODEC_TABLE: Record<number, string | undefined> = {
  [SWARM_MANIFEST_CODEC]: 'manifest',
  [SWARM_FEED_CODEC]: 'feed',
}

export type DecodedCID = {
  type: 'feed' | 'manifest'
  reference: Reference
}

export function convertReferenceToCid(reference: string | Uint8Array | Bytes, type: 'feed' | 'manifest'): string {
  reference = new Reference(reference)
  const base32 = 'b'
  const version = new Uint8Array([1])
  const codec = new Uint8Array([type === 'feed' ? SWARM_FEED_CODEC : SWARM_MANIFEST_CODEC])
  const unknown = new Uint8Array([1])
  const sha256 = new Uint8Array([27])
  const size = new Uint8Array([32])
  const header = Binary.uint8ArrayToBase32(Binary.concatBytes(version, codec, unknown, sha256, size)).replace(
    /\=+$/,
    '',
  )
  const hash = reference.toBase32().replace(/\=+$/, '')

  return `${base32}${header}${hash}`.toLowerCase()
}

export function convertCidToReference(cid: string): DecodedCID {
  const bytes = Binary.base32ToUint8Array(cid.toUpperCase().slice(1))
  const codec = bytes[1]

  if (!CODEC_TABLE[codec]) {
    throw new Error('Unknown codec')
  }
  const reference = new Reference(bytes.slice(-32))

  return {
    type: CODEC_TABLE[codec] as 'feed' | 'manifest',
    reference,
  }
}
