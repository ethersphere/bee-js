import { keccak256Hash } from '../chunk/hash'
import { Bytes, verifyBytes } from '../utils/bytes'
import { hexToBytes, assertHexString, HexString } from '../utils/hex'

export const TOPIC_LENGTH_BYTES = 32
export const TOPIC_LENGTH_HEX = 2 * TOPIC_LENGTH_BYTES

export type Topic = Bytes<32>

export function makeTopic(topic: Uint8Array | HexString): Topic {
  if (typeof topic === 'string') {
    assertHexString(topic, TOPIC_LENGTH_HEX + 2)
    const topicBytes = hexToBytes(topic)

    return verifyBytes(TOPIC_LENGTH_BYTES, topicBytes)
  } else if (topic instanceof Uint8Array) {
    return verifyBytes(TOPIC_LENGTH_BYTES, topic)
  }
  throw new TypeError('invalid topic')
}

export function makeTopicFromString(s: string): Topic {
  return keccak256Hash(s)
}
