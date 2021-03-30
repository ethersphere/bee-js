import { keccak256Hash } from '../utils/hash'
import { verifyBytes } from '../utils/bytes'
import { HexString, makeHexString, bytesToHex } from '../utils/hex'

export const TOPIC_BYTES_LENGTH = 32
export const TOPIC_HEX_LENGTH = 64

export type Topic = HexString<typeof TOPIC_HEX_LENGTH>

export function makeTopic(topic: Uint8Array | string): Topic {
  if (typeof topic === 'string') {
    return makeHexString(topic, TOPIC_HEX_LENGTH)
  } else if (topic instanceof Uint8Array) {
    verifyBytes(TOPIC_BYTES_LENGTH, topic)

    return bytesToHex(topic, TOPIC_HEX_LENGTH)
  }
  throw new TypeError('invalid topic')
}

export function makeTopicFromString(s: string): Topic {
  return bytesToHex(keccak256Hash(s), TOPIC_HEX_LENGTH)
}
