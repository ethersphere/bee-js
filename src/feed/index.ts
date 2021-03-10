import { keccak256Hash } from '../chunk/hash'
import { serializeBytes } from '../chunk/serialize'
import { Identifier, uploadSingleOwnerChunkData, verifySingleOwnerChunk } from '../chunk/soc'
import { FeedUpdateOptions, fetchFeedUpdate, FetchFeedUpdateResponse } from '../modules/feed'
import { Bytes, makeBytes, verifyBytes, verifyBytesAtOffset } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { bytesToHex, HexString, hexToBytes, assertHexString } from '../utils/hex'
import { readUint64BigEndian, writeUint64BigEndian } from '../utils/uint64'
import * as chunkAPI from '../modules/chunk'

import type { Signer } from '../chunk/signer'
import type { Reference, ReferenceResponse, UploadOptions } from '../types'
import type { Topic } from './topic'
import type { FeedType } from './type'
import type { EthAddress } from '../chunk/eth'

const TIMESTAMP_PAYLOAD_OFFSET = 0
const TIMESTAMP_PAYLOAD_SIZE = 8
const REFERENCE_PAYLOAD_OFFSET = TIMESTAMP_PAYLOAD_SIZE
const REFERENCE_PAYLOAD_MIN_SIZE = 32
const REFERENCE_PAYLOAD_MAX_SIZE = 64

export interface Epoch {
  time: number
  level: number
}
export type IndexBytes = Bytes<8>
export type Index = number | Epoch | IndexBytes | string

export interface FeedUploadOptions extends UploadOptions, FeedUpdateOptions {}

type PlainChunkReference = Bytes<32>
type EncryptedChunkReference = Bytes<64>
export type ChunkReference = PlainChunkReference | EncryptedChunkReference

export interface FeedUpdate {
  timestamp: number
  reference: ChunkReference
}

/**
 * FeedReader is an interface for downloading feed updates
 */
export interface FeedReader {
  readonly type: FeedType
  readonly owner: EthAddress
  readonly topic: Topic
  /**
   * Download the latest feed update
   */
  download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse>
}

/**
 * FeedWriter is an interface for updating feeds
 */
export interface FeedWriter extends FeedReader {
  /**
   * Upload a new feed update
   *
   * @param reference The reference to be stored in the new update
   * @param options   Additional options like `at`
   *
   * @returns The reference of the new update
   */
  upload(reference: ChunkReference | Reference, options?: FeedUploadOptions): Promise<ReferenceResponse>
}

export function isEpoch(epoch: unknown): epoch is Epoch {
  return typeof epoch === 'object' && epoch !== null && 'time' in epoch && 'level' in epoch
}

function hashFeedIdentifier(topic: Topic, index: IndexBytes): Identifier {
  return keccak256Hash(topic, index)
}

export function makeSequentialFeedIdentifier(topic: Topic, index: number): Identifier {
  const indexBytes = writeUint64BigEndian(index)

  return hashFeedIdentifier(topic, indexBytes)
}

export function makeFeedIndexBytes(s: string): IndexBytes {
  assertHexString(s)
  const bytes = hexToBytes(s)

  return verifyBytes(8, bytes)
}

export function makeFeedIdentifier(topic: Topic, index: Index): Identifier {
  if (typeof index === 'number') {
    return makeSequentialFeedIdentifier(topic, index)
  } else if (typeof index === 'string') {
    const indexBytes = makeFeedIndexBytes(index)

    return hashFeedIdentifier(topic, indexBytes)
  } else if (isEpoch(index)) {
    throw new TypeError('epoch is not yet implemented')
  }

  return hashFeedIdentifier(topic, index)
}

export function uploadFeedUpdate(
  url: string,
  signer: Signer,
  topic: Topic,
  index: Index,
  reference: ChunkReference,
  options?: FeedUploadOptions,
): Promise<ReferenceResponse> {
  const identifier = makeFeedIdentifier(topic, index)
  const at = options?.at ?? Date.now() / 1000.0
  const timestamp = writeUint64BigEndian(at)
  const payloadBytes = serializeBytes(timestamp, reference)

  return uploadSingleOwnerChunkData(url, signer, identifier, payloadBytes, options)
}

export async function findNextIndex(
  url: string,
  owner: HexString,
  topic: HexString,
  options?: FeedUpdateOptions,
): Promise<string> {
  try {
    const feedUpdate = await fetchFeedUpdate(url, owner, topic, options)

    return feedUpdate.feedIndexNext
  } catch (e) {
    if (e instanceof BeeResponseError && e.status === 404) {
      return bytesToHex(makeBytes(8))
    }
    throw e
  }
}

export async function updateFeed(
  url: string,
  signer: Signer,
  topic: Topic,
  reference: ChunkReference,
  options?: FeedUploadOptions,
): Promise<ReferenceResponse> {
  const ownerHex = bytesToHex(signer.address)
  const topicHex = bytesToHex(topic)
  const nextIndex = await findNextIndex(url, ownerHex, topicHex, options)

  return uploadFeedUpdate(url, signer, topic, nextIndex, reference, options)
}

function verifyChunkReferenceAtOffset(offset: number, data: Uint8Array): ChunkReference {
  try {
    return verifyBytesAtOffset(offset, REFERENCE_PAYLOAD_MAX_SIZE, data)
  } catch (e) {
    return verifyBytesAtOffset(offset, REFERENCE_PAYLOAD_MIN_SIZE, data)
  }
}

export function verifyChunkReference(data: Uint8Array): ChunkReference {
  return verifyChunkReferenceAtOffset(0, data)
}

export async function downloadFeedUpdate(
  url: string,
  owner: EthAddress,
  topic: Topic,
  index: Index,
): Promise<FeedUpdate> {
  const identifier = makeFeedIdentifier(topic, index)
  const address = keccak256Hash(identifier, owner)
  const addressHex = bytesToHex(address)
  const data = await chunkAPI.download(url, addressHex)
  const soc = verifySingleOwnerChunk(data, address)
  const payload = soc.payload()
  const timestampBytes = verifyBytesAtOffset(TIMESTAMP_PAYLOAD_OFFSET, TIMESTAMP_PAYLOAD_SIZE, payload)
  const timestamp = readUint64BigEndian(timestampBytes)
  const reference = verifyChunkReferenceAtOffset(REFERENCE_PAYLOAD_OFFSET, payload)

  return {
    timestamp,
    reference,
  }
}

export function makeFeedReader(url: string, type: FeedType, topic: Topic, owner: EthAddress): FeedReader {
  const ownerHex = bytesToHex(owner)
  const topicHex = bytesToHex(topic)
  const download = (options?: FeedUpdateOptions) => fetchFeedUpdate(url, ownerHex, topicHex, { ...options, type })

  return {
    type,
    owner,
    topic,
    download,
  }
}

function makeChunkReference(reference: ChunkReference | Reference): ChunkReference {
  if (typeof reference === 'string') {
    assertHexString(reference)
    const referenceBytes = hexToBytes(reference)

    return verifyChunkReference(referenceBytes)
  } else if (reference instanceof Uint8Array) {
    return verifyChunkReference(reference)
  }
  throw new TypeError('invalid chunk reference')
}

export function makeFeedWriter(url: string, type: FeedType, topic: Topic, signer: Signer): FeedWriter {
  const upload = (reference: ChunkReference | Reference, options?: FeedUploadOptions) => {
    const canonicalReference = makeChunkReference(reference)

    return updateFeed(url, signer, topic, canonicalReference, { ...options, type })
  }

  return {
    ...makeFeedReader(url, type, topic, signer.address),
    upload,
  }
}
