import { serializeBytes } from '../chunk/serialize'
import { makeSingleOwnerChunkFromData, uploadSingleOwnerChunkData } from '../chunk/soc'
import * as chunkAPI from '../modules/chunk'
import { FeedUpdateOptions, FetchFeedUpdateResponse, fetchLatestFeedUpdate } from '../modules/feed'
import {
  Address,
  BatchId,
  BeeRequestOptions,
  BytesReference,
  FeedReader,
  FeedWriter,
  FEED_INDEX_HEX_LENGTH,
  PlainBytesReference,
  Reference,
  Signer,
  Topic,
  UploadOptions,
} from '../types'
import { Bytes, bytesAtOffset, makeBytes } from '../utils/bytes'
import { EthAddress, HexEthAddress, makeHexEthAddress } from '../utils/eth'
import { keccak256Hash } from '../utils/hash'
import { bytesToHex, HexString, hexToBytes, makeHexString } from '../utils/hex'
import { makeBytesReference } from '../utils/reference'
import { assertAddress } from '../utils/type'
import { readUint64BigEndian, writeUint64BigEndian } from '../utils/uint64'
import { makeFeedIdentifier } from './identifier'
import type { FeedType } from './type'

const TIMESTAMP_PAYLOAD_OFFSET = 0
const TIMESTAMP_PAYLOAD_SIZE = 8
const REFERENCE_PAYLOAD_OFFSET = TIMESTAMP_PAYLOAD_SIZE

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
  reference: BytesReference,
  postageBatchId: BatchId,
  options?: FeedUploadOptions,
  index: Index = 'latest',
): Promise<Reference> {
  const ownerHex = makeHexEthAddress(signer.address)
  const nextIndex = index === 'latest' ? await findNextIndex(requestOptions, ownerHex, topic, options) : index

  const identifier = makeFeedIdentifier(topic, nextIndex)
  const at = options?.at ?? Date.now() / 1000.0
  const timestamp = writeUint64BigEndian(at)
  const payloadBytes = serializeBytes(timestamp, reference)

  return uploadSingleOwnerChunkData(requestOptions, signer, postageBatchId, identifier, payloadBytes, options)
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
): Promise<FeedUpdate> {
  const address = getFeedUpdateChunkReference(owner, topic, index)
  const addressHex = bytesToHex(address)
  const data = await chunkAPI.download(requestOptions, addressHex)
  const soc = makeSingleOwnerChunkFromData(data, address)
  const payload = soc.payload()
  const timestampBytes = bytesAtOffset(payload, TIMESTAMP_PAYLOAD_OFFSET, TIMESTAMP_PAYLOAD_SIZE)
  const timestamp = readUint64BigEndian(timestampBytes)
  const reference = makeBytesReference(payload, REFERENCE_PAYLOAD_OFFSET)

  return {
    timestamp,
    reference,
  }
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
      if (!options?.index) {
        return fetchLatestFeedUpdate(requestOptions, owner, topic, { ...options, type })
      }

      const update = await downloadFeedUpdate(requestOptions, hexToBytes(owner), topic, options.index)

      return {
        reference: bytesToHex(update.reference),
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
    reference: BytesReference | Reference,
    options?: FeedUploadOptions,
  ) => {
    assertAddress(postageBatchId)
    const canonicalReference = makeBytesReference(reference)

    return updateFeed(requestOptions, signer, topic, canonicalReference, postageBatchId, { ...options, type })
  }

  return {
    ...makeFeedReader(requestOptions, type, topic, makeHexEthAddress(signer.address)),
    upload,
  }
}
