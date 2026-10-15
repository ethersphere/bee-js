import { Bytes, FeedIndex, Identifier, Topic, keccak256 } from '@ethersphere/core-sdk'

export function makeFeedIdentifier(topic: Topic, index: FeedIndex | number): Identifier {
  index = typeof index === 'number' ? FeedIndex.fromBigInt(BigInt(index)) : index

  return new Identifier(keccak256(Bytes.concat(topic.toUint8Array(), index.toUint8Array())))
}
