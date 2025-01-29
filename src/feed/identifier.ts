import { Binary } from 'cafe-utility'
import { FeedIndex, Identifier, Topic } from '../utils/typed-bytes'

export function makeFeedIdentifier(topic: Topic, index: FeedIndex | number): Identifier {
  index = typeof index === 'number' ? FeedIndex.fromBigInt(BigInt(index)) : index
  return new Identifier(Binary.keccak256(Binary.concatBytes(topic.toUint8Array(), index.toUint8Array())))
}
