import { uploadSingleOwnerChunkData } from '../chunk/soc'
import { Chunk } from '../chunk/cac'
import { FeedUpdateOptions, FetchFeedUpdateResponse, fetchFeedUpdate } from '../modules/feed'
import {
  Address,
  BatchId,
  BeeRequestOptions,
  BytesReference,
  FEED_INDEX_HEX_LENGTH,
  FeedReader,
  FeedWriter,
  PlainBytesReference,
  Reference,
  Signer,
  Topic,
  UploadOptions,
} from '../types'
import { Bytes, makeBytes } from '../utils/bytes'
import { EthAddress, HexEthAddress, makeHexEthAddress } from '../utils/eth'
import { keccak256Hash } from '../utils/hash'
import { HexString, bytesToHex, makeHexString } from '../utils/hex'
import { assertAddress } from '../utils/type'
import { makeFeedIdentifier } from './identifier'
import type { FeedType } from './type'

export interface Epoch {
  time: number
  level: number
}

/**
 * Bytes of Feed's Index.
 * For Sequential Feeds this is numeric value in big-endian.
 */
export type IndexBytes = Bytes<8>
export type Index = number | Epoch | IndexBytes | string

export interface FeedUploadOptions extends UploadOptions, FeedUpdateOptions {}

export interface FeedUpdate {
  timestamp: number
  reference: BytesReference
}

export async function findNextIndex(
  requestOptions: BeeRequestOptions,
  owner: HexEthAddress,
  topic: Topic,
  options?: FeedUpdateOptions,
): Promise<HexString<typeof FEED_INDEX_HEX_LENGTH>> {
  try {
    const feedUpdate = await fetchFeedUpdate(requestOptions, owner, topic, options)

    return makeHexString(feedUpdate.feedIndexNext, FEED_INDEX_HEX_LENGTH)
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return bytesToHex(makeBytes(8))
    }
    throw e
  }
}

export async function updateFeed(
  requestOptions: BeeRequestOptions,
  signer: Signer,
  topic: Topic,
  payload: Uint8Array | Chunk,
  postageBatchId: BatchId,
  options?: FeedUploadOptions,
): Promise<Reference> {
  const ownerHex = makeHexEthAddress(signer.address)
  const nextIndex = options?.index || (await findNextIndex(requestOptions, ownerHex, topic, options))

  const identifier = makeFeedIdentifier(topic, nextIndex)

  return uploadSingleOwnerChunkData(requestOptions, signer, postageBatchId, identifier, payload, options)
}

export function getFeedUpdateChunkReference(owner: EthAddress, topic: Topic, index: Index): PlainBytesReference {
  const identifier = makeFeedIdentifier(topic, index)

  return keccak256Hash(identifier, owner)
}

export function makeFeedReader(
  requestOptions: BeeRequestOptions,
  type: FeedType,
  topic: Topic,
  owner: HexEthAddress,
): FeedReader {
  return {
    type,
    owner,
    topic,
    async download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse> {
      return fetchFeedUpdate(requestOptions, owner, topic, { ...options, type })
    },
  }
}

export function makeFeedWriter(
  requestOptions: BeeRequestOptions,
  type: FeedType,
  topic: Topic,
  signer: Signer,
): FeedWriter {
  const upload = async (postageBatchId: string | Address, payload: Uint8Array | Chunk, options?: FeedUploadOptions) => {
    assertAddress(postageBatchId)

    return updateFeed(requestOptions, signer, topic, payload, postageBatchId, { ...options, type })
  }

  return {
    ...makeFeedReader(requestOptions, type, topic, makeHexEthAddress(signer.address)),
    upload,
  }
}
