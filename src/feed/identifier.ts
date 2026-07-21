import { FeedIndex, Identifier, Topic } from '../utils/typed-bytes'
import { concatBytes, keccak256 } from 'swarm-core'

export function makeFeedIdentifier(topic: Topic, index: FeedIndex | number): Identifier {
  index = typeof index === 'number' ? FeedIndex.fromBigInt(BigInt(index)) : index

  return new Identifier(keccak256(concatBytes(topic.toUint8Array(), index.toUint8Array())))
}
