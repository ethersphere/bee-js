import { uploadSingleOwnerChunkData } from '../chunk/soc'
import { ChunkParam } from '../chunk/cac'
import { FeedUpdateOptions, FetchFeedUpdateResponse, fetchLatestFeedUpdate } from '../modules/feed'
import * as socAPI from '../modules/soc'
import {
  Address,
  BatchId,
  BeeRequestOptions,
  Data,
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
import { HexString, bytesToHex, hexToBytes, makeHexString } from '../utils/hex'
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

export async function findNextIndex(
  requestOptions: BeeRequestOptions,
  owner: HexEthAddress,
  topic: Topic,
  options?: FeedUpdateOptions,
): Promise<HexString<typeof FEED_INDEX_HEX_LENGTH>> {
  try {
    const feedUpdate = await fetchLatestFeedUpdate(requestOptions, owner, topic, options)

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
  payload: Uint8Array | ChunkParam,
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

export async function downloadFeedUpdate(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
  index: Index,
): Promise<Data> {
  const identifier = makeFeedIdentifier(topic, index)

  return socAPI.download(requestOptions, bytesToHex(owner), bytesToHex(identifier))
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
      if (!options?.index && options?.index !== 0) {
        return fetchLatestFeedUpdate(requestOptions, owner, topic, { ...options, type })
      }

      const update = await downloadFeedUpdate(requestOptions, hexToBytes(owner), topic, options.index)

      return {
        data: update,
        feedIndex: options.index,
        feedIndexNext: '',
      }
    },
  }
}

export function makeFeedWriter(
  requestOptions: BeeRequestOptions,
  type: FeedType,
  topic: Topic,
  signer: Signer,
): FeedWriter {
  const upload = async (
    postageBatchId: string | Address,
    payload: Uint8Array | ChunkParam,
    options?: FeedUploadOptions,
  ) => {
    assertAddress(postageBatchId)

    return updateFeed(requestOptions, signer, topic, payload, postageBatchId, { ...options, type })
  }

  return {
    ...makeFeedReader(requestOptions, type, topic, makeHexEthAddress(signer.address)),
    upload,
  }
}
