import { keccak256Hash } from '../utils/hash'
import { serializeBytes } from '../chunk/serialize'
import { FeedUpdateOptions, fetchLatestFeedUpdate, FetchFeedUpdateResponse } from '../modules/feed'
import { makeSingleOwnerChunkFromData, uploadSingleOwnerChunkData } from '../chunk/soc'
import {
  Address,
  BatchId,
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
import { Bytes, bytesAtOffset, makeBytes } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { bytesToHex, hexToBytes, HexString, makeHexString } from '../utils/hex'
import { readUint64BigEndian, writeUint64BigEndian } from '../utils/uint64'
import * as chunkAPI from '../modules/chunk'
import { EthAddress, HexEthAddress, makeHexEthAddress } from '../utils/eth'
import type { Options as KyOptions } from 'ky'

import type { FeedType } from './type'
import { assertAddress } from '../utils/type'
import { makeFeedIdentifier } from './identifier'
import { makeBytesReference } from '../utils/reference'

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
  kyOptions: KyOptions,
  owner: HexEthAddress,
  topic: Topic,
  options?: FeedUpdateOptions,
): Promise<HexString<typeof FEED_INDEX_HEX_LENGTH>> {
  try {
    const feedUpdate = await fetchLatestFeedUpdate(kyOptions, owner, topic, options)

    return makeHexString(feedUpdate.feedIndexNext, FEED_INDEX_HEX_LENGTH)
  } catch (e) {
    if (e instanceof BeeResponseError && e.status === 404) {
      return bytesToHex(makeBytes(8))
    }
    throw e
  }
}

export async function updateFeed(
  kyOptions: KyOptions,
  signer: Signer,
  topic: Topic,
  reference: BytesReference,
  postageBatchId: BatchId,
  options?: FeedUploadOptions,
  index: Index = 'latest',
): Promise<Reference> {
  const ownerHex = makeHexEthAddress(signer.address)
  const nextIndex = index === 'latest' ? await findNextIndex(kyOptions, ownerHex, topic, options) : index

  const identifier = makeFeedIdentifier(topic, nextIndex)
  const at = options?.at ?? Date.now() / 1000.0
  const timestamp = writeUint64BigEndian(at)
  const payloadBytes = serializeBytes(timestamp, reference)

  return uploadSingleOwnerChunkData(kyOptions, signer, postageBatchId, identifier, payloadBytes, options)
}

export function getFeedUpdateChunkReference(owner: EthAddress, topic: Topic, index: Index): PlainBytesReference {
  const identifier = makeFeedIdentifier(topic, index)

  return keccak256Hash(identifier, owner)
}

export async function downloadFeedUpdate(
  kyOptions: KyOptions,
  owner: EthAddress,
  topic: Topic,
  index: Index,
): Promise<FeedUpdate> {
  const address = getFeedUpdateChunkReference(owner, topic, index)
  const addressHex = bytesToHex(address)
  const data = await chunkAPI.download(kyOptions, addressHex)
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

export function makeFeedReader(kyOptions: KyOptions, type: FeedType, topic: Topic, owner: HexEthAddress): FeedReader {
  return {
    type,
    owner,
    topic,
    async download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse> {
      if (!options?.index) {
        return fetchLatestFeedUpdate(kyOptions, owner, topic, { ...options, type })
      }

      const update = await downloadFeedUpdate(kyOptions, hexToBytes(owner), topic, options.index)

      return {
        reference: bytesToHex(update.reference),
        feedIndex: options.index,
        feedIndexNext: '',
      }
    },
  }
}

export function makeFeedWriter(kyOptions: KyOptions, type: FeedType, topic: Topic, signer: Signer): FeedWriter {
  const upload = async (
    postageBatchId: string | Address,
    reference: BytesReference | Reference,
    options?: FeedUploadOptions,
  ) => {
    assertAddress(postageBatchId)
    const canonicalReference = makeBytesReference(reference)

    return updateFeed(kyOptions, signer, topic, canonicalReference, postageBatchId, { ...options, type })
  }

  return {
    ...makeFeedReader(kyOptions, type, topic, makeHexEthAddress(signer.address)),
    upload,
  }
}
