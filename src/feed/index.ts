import { makeContentAddressedChunk } from '../chunk/cac'
import { keccak256Hash } from '../chunk/hash'
import { serializeBytes } from '../chunk/serialize'
import { EthAddress, Signer } from '../chunk/signer'
import { Identifier, makeSingleOwnerChunk, verifySingleOwnerChunk } from '../chunk/soc'
import { uploadSingleOwnerChunk } from '../chunk/soc'
import { createFeedManifest, FeedUpdateOptions, fetchFeedUpdate, FetchFeedUpdateResponse } from '../modules/feed'
import { Reference, ReferenceResponse, UploadOptions } from '../types'
import { Bytes, makeBytes, verifyBytes, verifyBytesAtOffset } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { bytesToHex, HexString, hexToBytes, verifyHex } from '../utils/hex'
import { readUint64BigEndian, writeUint64BigEndian } from '../utils/uint64'
import * as chunkAPI from '../modules/chunk'
import { Topic } from './topic'
import { Owner } from '../chunk/owner'
import { FeedType } from './type'

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
  readonly owner: Owner
  readonly topic: Topic
  /**
   * Download the latest feed update
   */
  download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse>
  /**
   * Create feed manifest chunk and return the reference
   */
  createManifest(): Promise<ReferenceResponse>
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
  const hex = verifyHex(s)
  const bytes = hexToBytes(hex)

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

export async function uploadFeedUpdate(
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
  const cac = makeContentAddressedChunk(payloadBytes)
  const soc = await makeSingleOwnerChunk(cac, identifier, signer)
  const response = await uploadSingleOwnerChunk(url, soc, options)

  return response
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

export function makeFeedReader(url: string, type: FeedType, topic: Topic, owner: Owner): FeedReader {
  const ownerHex = bytesToHex(owner)
  const topicHex = bytesToHex(topic)
  const download = (options?: FeedUpdateOptions) => fetchFeedUpdate(url, ownerHex, topicHex, { ...options, type })
  const createManifest = () => createFeedManifest(url, ownerHex, topicHex, { type })

  return {
    type,
    owner,
    topic,
    download,
    createManifest,
  }
}

function makeChunkReference(reference: ChunkReference | Reference): ChunkReference {
  if (typeof reference === 'string') {
    const hexReference = verifyHex(reference)
    const referenceBytes = hexToBytes(hexReference)

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
