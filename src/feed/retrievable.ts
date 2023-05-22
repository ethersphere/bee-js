import { Bee } from '../bee'
import { BeeRequestOptions, Reference, Topic } from '../types'
import { EthAddress } from '../utils/eth'
import { bytesToHex } from '../utils/hex'
import { readUint64BigEndian } from '../utils/uint64'
import { getFeedUpdateChunkReference, Index } from './index'

function makeNumericIndex(index: Index): number {
  if (index instanceof Uint8Array) {
    return readUint64BigEndian(index)
  }

  if (typeof index === 'string') {
    return parseInt(index)
  }

  if (typeof index === 'number') {
    return index
  }

  throw new TypeError('Unknown type of index!')
}

/**
 * Function that checks if a chunk is retrievable by actually downloading it.
 * The /stewardship/{reference} endpoint does not support verification of chunks, but only manifest's references.
 *
 * @param bee
 * @param ref
 * @param options
 */
async function isChunkRetrievable(bee: Bee, ref: Reference, requestOptions: BeeRequestOptions): Promise<boolean> {
  try {
    await bee.downloadChunk(ref, requestOptions)

    return true
  } catch (e: any) {
    if (e?.response?.status === 404) {
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
function getAllSequenceUpdateReferences(owner: EthAddress, topic: Topic, index: Index): Reference[] {
  const numIndex = makeNumericIndex(index)
  const updateReferences: Reference[] = new Array(numIndex + 1)

  for (let i = 0; i <= numIndex; i++) {
    updateReferences[i] = bytesToHex(getFeedUpdateChunkReference(owner, topic, i))
  }

  return updateReferences
}

export async function areAllSequentialFeedsUpdateRetrievable(
  bee: Bee,
  owner: EthAddress,
  topic: Topic,
  index: Index,
  requestOptions: BeeRequestOptions,
): Promise<boolean> {
  const chunkRetrievablePromises = getAllSequenceUpdateReferences(owner, topic, index).map(async ref =>
    isChunkRetrievable(bee, ref, requestOptions),
  )

  return (await Promise.all(chunkRetrievablePromises)).every(result => result)
}
