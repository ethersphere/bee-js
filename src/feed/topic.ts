import { keccak256Hash } from '../utils/hash.js'
import { assertBytes } from '../utils/bytes.js'
import { makeHexString, bytesToHex } from '../utils/hex.js'
import { Topic, TOPIC_BYTES_LENGTH, TOPIC_HEX_LENGTH } from '../types/index.js'

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
  if (typeof s !== 'string') {
    throw new TypeError('topic has to be string!')
  }

  return bytesToHex(keccak256Hash(s), TOPIC_HEX_LENGTH)
}
