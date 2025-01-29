import { Objects } from 'cafe-utility'
import { Bee } from '../bee'
import { BeeRequestOptions } from '../types'
import { EthAddress, FeedIndex, Reference, Topic } from '../utils/typed-bytes'
import { getFeedUpdateChunkReference } from './index'

/**
 * Function that checks if a chunk is retrievable by actually downloading it.
 * The /stewardship/{reference} endpoint does not support verification of chunks, but only manifest's references.
 *
 * @param bee
 * @param ref
 * @param options
 */
async function isChunkRetrievable(bee: Bee, reference: Reference, requestOptions: BeeRequestOptions): Promise<boolean> {
  try {
    await bee.downloadChunk(reference, requestOptions)

    return true
  } catch (e: unknown) {
    const status = Objects.getDeep(e, 'status')

    if (status === 404 || status === 500) {
      return false
    }

    throw e
  }
}

/**
 * Creates array of references for all sequence updates chunk up to the given index.
 *
 * @param owner
 * @param topic
 * @param index
 */
function getAllSequenceUpdateReferences(owner: EthAddress, topic: Topic, index: FeedIndex): Reference[] {
  const count = index.toBigInt()
  const updateReferences: Reference[] = []

  for (let i = 0n; i <= count; i++) {
    updateReferences.push(getFeedUpdateChunkReference(owner, topic, FeedIndex.fromBigInt(i)))
  }

  return updateReferences
}

export async function areAllSequentialFeedsUpdateRetrievable(
  bee: Bee,
  owner: EthAddress,
  topic: Topic,
  index: FeedIndex,
  requestOptions: BeeRequestOptions,
): Promise<boolean> {
  const chunkRetrievablePromises = getAllSequenceUpdateReferences(owner, topic, index).map(async reference =>
    isChunkRetrievable(bee, reference, requestOptions),
  )

  return (await Promise.all(chunkRetrievablePromises)).every(result => result)
}
