import { keccak256Hash } from '../utils/hash'
import { assertBytes } from '../utils/bytes'
import { makeHexString, bytesToHex } from '../utils/hex'
import { Topic, TOPIC_BYTES_LENGTH, TOPIC_HEX_LENGTH } from '../types'

export function makeTopic(topic: Uint8Array | string): Topic {
  if (typeof topic === 'string') {
    return makeHexString(topic, TOPIC_HEX_LENGTH)
  } else if (topic instanceof Uint8Array) {
    assertBytes(topic, TOPIC_BYTES_LENGTH)

    return bytesToHex(topic, TOPIC_HEX_LENGTH)
  }
  throw new TypeError('invalid topic')
}

export function makeTopicFromString(s: string): Topic {
  return bytesToHex(keccak256Hash(s), TOPIC_HEX_LENGTH)
}
