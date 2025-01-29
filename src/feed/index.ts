import { Binary } from 'cafe-utility'
import { makeSingleOwnerChunkFromData, uploadSingleOwnerChunkData } from '../chunk/soc'
import * as chunkAPI from '../modules/chunk'
import { FeedUpdateOptions, FetchFeedUpdateResponse, fetchLatestFeedUpdate } from '../modules/feed'
import { BeeRequestOptions, FeedReader, FeedWriter, UploadOptions, UploadResult } from '../types'
import { Bytes } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { BatchId, EthAddress, FeedIndex, PrivateKey, Reference, Topic } from '../utils/typed-bytes'
import { makeFeedIdentifier } from './identifier'

const TIMESTAMP_PAYLOAD_OFFSET = 0
const TIMESTAMP_PAYLOAD_SIZE = 8
const REFERENCE_PAYLOAD_OFFSET = TIMESTAMP_PAYLOAD_SIZE

export interface Epoch {
  time: number
  level: number
}

export interface FeedUploadOptions extends UploadOptions, FeedUpdateOptions {}

export interface FeedUpdate {
  timestamp: number
  payload: Bytes
}

export async function findNextIndex(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
): Promise<FeedIndex> {
  try {
    const feedUpdate = await fetchLatestFeedUpdate(requestOptions, owner, topic)

    if (!feedUpdate.feedIndexNext) {
      throw Error('Feed index next is not defined. This should happen when fetching an exact index.')
    }

    return feedUpdate.feedIndexNext
  } catch (e: any) {
    if (e instanceof BeeResponseError) {
      return FeedIndex.fromBigInt(0n)
    }
    throw e
  }
}

export async function updateFeed(
  requestOptions: BeeRequestOptions,
  signer: PrivateKey,
  topic: Topic,
  reference: Reference | string | Uint8Array,
  postageBatchId: BatchId,
  options?: FeedUploadOptions,
): Promise<UploadResult> {
  reference = new Reference(reference)
  const nextIndex = options?.index ?? (await findNextIndex(requestOptions, signer.publicKey().address(), topic))

  const identifier = makeFeedIdentifier(topic, nextIndex)
  const at = options?.at ?? Date.now() / 1000.0
  const timestamp = Binary.numberToUint64(BigInt(Math.floor(at)), 'BE')
  const payloadBytes = Binary.concatBytes(timestamp, reference.toUint8Array())

  return uploadSingleOwnerChunkData(requestOptions, signer, postageBatchId, identifier, payloadBytes, options)
}

export function getFeedUpdateChunkReference(owner: EthAddress, topic: Topic, index: FeedIndex): Reference {
  const identifier = makeFeedIdentifier(topic, index)

  return new Reference(Binary.keccak256(Binary.concatBytes(identifier.toUint8Array(), owner.toUint8Array())))
}

export async function downloadFeedUpdate(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
  index: FeedIndex | number,
): Promise<FeedUpdate> {
  index = typeof index === 'number' ? FeedIndex.fromBigInt(BigInt(index)) : index
  const address = getFeedUpdateChunkReference(owner, topic, index)
  const data = await chunkAPI.download(requestOptions, address.toHex())
  const soc = makeSingleOwnerChunkFromData(data, address)
  const timestampBytes = Bytes.fromSlice(soc.payload.toUint8Array(), TIMESTAMP_PAYLOAD_OFFSET, TIMESTAMP_PAYLOAD_SIZE)
  const timestamp = Number(Binary.uint64ToNumber(timestampBytes.toUint8Array(), 'BE'))

  return {
    timestamp,
    payload: new Bytes(soc.payload.offset(REFERENCE_PAYLOAD_OFFSET)),
  }
}

export function makeFeedReader(requestOptions: BeeRequestOptions, topic: Topic, owner: EthAddress): FeedReader {
  return {
    owner,
    topic,
    async download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse> {
      if (options?.index === undefined) {
        return fetchLatestFeedUpdate(requestOptions, owner, topic)
      }

      const update = await downloadFeedUpdate(requestOptions, owner, topic, options.index)

      const feedIndex = typeof options.index === 'number' ? FeedIndex.fromBigInt(BigInt(options.index)) : options.index

      return {
        payload: update.payload,
        feedIndex,
      }
    },
  }
}

export function makeFeedWriter(requestOptions: BeeRequestOptions, topic: Topic, signer: PrivateKey): FeedWriter {
  const upload = async (
    postageBatchId: BatchId,
    reference: Reference | string | Uint8Array,
    options?: FeedUploadOptions,
  ) => {
    return updateFeed(requestOptions, signer, topic, reference, postageBatchId, options)
  }

  return {
    ...makeFeedReader(requestOptions, topic, signer.publicKey().address()),
    upload,
  }
}
