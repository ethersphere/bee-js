import { Binary } from 'cafe-utility'
import { Reference } from '..'

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

export function convertReferenceToCid(reference: Reference | string, type: 'feed' | 'manifest'): string {
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
  const hash = Binary.uint8ArrayToBase32(Binary.hexToUint8Array(reference)).replace(/\=+$/, '')

  return `${base32}${header}${hash}`.toLowerCase()
}

export function convertCidToReference(cid: string): DecodedCID {
  const bytes = Binary.base32ToUint8Array(cid.toLowerCase())
  const codec = bytes[2]

  if (!CODEC_TABLE[codec]) {
    throw new Error('Unknown codec')
  }
  const reference = bytes.slice(-32)

  return {
    type: CODEC_TABLE[codec] as 'feed' | 'manifest',
    reference: Binary.uint8ArrayToHex(reference) as Reference,
  }
}
