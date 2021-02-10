import { keccak256Hash } from '../chunk/hash'
import { Bytes, verifyBytes } from '../utils/bytes'
import { hexToBytes, verifyHex } from '../utils/hex'

export type Topic = Bytes<32>

export function verifyTopic(topic: Topic | Uint8Array | string): Topic {
  if (typeof topic === 'string') {
    const topicHex = verifyHex(topic)
    const topicBytes = hexToBytes(topicHex)

    return verifyBytes(32, topicBytes)
  }

  return verifyBytes(32, topic)
}

export function makeTopicFromString(s: string): Topic {
  return keccak256Hash(s)
}
