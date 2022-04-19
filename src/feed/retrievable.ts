import { Bee } from '../bee'
import { EthAddress } from '../utils/eth'
import { Reference, RequestOptions, Topic } from '../types'
import { getFeedUpdateChunkReference, Index } from './index'
import { readUint64BigEndian } from '../utils/uint64'
import { bytesToHex } from '../utils/hex'
import { BeeResponseError } from '../utils/error'

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
async function isChunkRetrievable(bee: Bee, ref: Reference, options?: RequestOptions): Promise<boolean> {
  try {
    await bee.downloadChunk(ref, options)

    return true
  } catch (e) {
    const err = e as BeeResponseError

    if (err.status === 404) {
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
  options?: RequestOptions,
): Promise<boolean> {
  const chunkRetrievablePromises = getAllSequenceUpdateReferences(owner, topic, index).map(async ref =>
    isChunkRetrievable(bee, ref, options),
  )

  return (await Promise.all(chunkRetrievablePromises)).every(result => result)
}
