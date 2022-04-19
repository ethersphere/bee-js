import { FEED_INDEX_HEX_LENGTH, Topic } from '../types'
import { Identifier } from '../chunk/soc'
import { keccak256Hash } from '../utils/hash'
import { hexToBytes, makeHexString } from '../utils/hex'
import { writeUint64BigEndian } from '../utils/uint64'
import { Epoch, Index, IndexBytes } from './index'

function isEpoch(epoch: unknown): epoch is Epoch {
  return typeof epoch === 'object' && epoch !== null && 'time' in epoch && 'level' in epoch
}

function hashFeedIdentifier(topic: Topic, index: IndexBytes): Identifier {
  return keccak256Hash(hexToBytes(topic), index)
}

function makeSequentialFeedIdentifier(topic: Topic, index: number): Identifier {
  const indexBytes = writeUint64BigEndian(index)

  return hashFeedIdentifier(topic, indexBytes)
}

function makeFeedIndexBytes(s: string): IndexBytes {
  const hex = makeHexString(s, FEED_INDEX_HEX_LENGTH)

  return hexToBytes(hex)
}

export function makeFeedIdentifier(topic: Topic, index: Index): Identifier {
  if (typeof index === 'number') {
    return makeSequentialFeedIdentifier(topic, index)
  } else if (typeof index === 'string') {
    const indexBytes = makeFeedIndexBytes(index)

    return hashFeedIdentifier(topic, indexBytes)
  } else if (isEpoch(index)) {
    throw new TypeError('epoch is not yet implemented')
  }

  return hashFeedIdentifier(topic, index)
}
