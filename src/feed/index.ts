import { makeContentAddressedChunk } from '../chunk/cac'
import { keccak256Hash } from '../chunk/hash'
import { serializeBytes } from '../chunk/serialize'
import { EthAddress, Signer } from '../chunk/signer'
import { Identifier, makeSingleOwnerChunk, verifySingleOwnerChunk } from '../chunk/soc'
import { uploadSingleOwnerChunk } from '../chunk/upload'
import { FeedType, findFeedUpdate } from '../modules/feed'
import { ReferenceResponse, UploadOptions } from '../types'
import { Bytes, makeBytes, verifyBytes, verifyBytesAtOffset } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { bytesToHex, HexString, hexToBytes, verifyHex } from '../utils/hex'
import { readUint64BigEndian, writeUint64BigEndian } from '../utils/uint64'
import * as chunkAPI from '../modules/chunk'

const TIMESTAMP_PAYLOAD_OFFSET = 0
const TIMESTAMP_PAYLOAD_SIZE = 8
const REFERENCE_PAYLOAD_OFFSET = TIMESTAMP_PAYLOAD_SIZE
const REFERENCE_PAYLOAD_MIN_SIZE = 32
const REFERENCE_PAYLOAD_MAX_SIZE = 64

export type Topic = Bytes<32>

export function makeSequentialFeedIdentifier(topic: Topic, index: number): Identifier {
  const indexBytes = writeUint64BigEndian(index)

  return keccak256Hash(topic, indexBytes)
}

interface IndexBase {
  type: FeedType
}

interface SequentialIndex extends IndexBase {
  type: 'sequence'
  value: number
}

interface EpochIndex extends IndexBase {
  type: 'epoch'
  value: {
    time: number
    level: number
  }
}
type Index = SequentialIndex | EpochIndex

export function makeFeedIdentifier(topic: Topic, index: Index): Identifier {
  switch (index.type) {
    case 'sequence': return makeSequentialFeedIdentifier(topic, index.value)
    case 'epoch': throw 'epoch is not yet implemented'
  }
}

type PlainChunkReference = Bytes<32>
type EncryptedChunkReference = Bytes<64>
export type ChunkReference = PlainChunkReference | EncryptedChunkReference

export async function uploadFeedUpdate(
  url: string,
  signer: Signer,
  topic: Topic,
  index: number,
  reference: ChunkReference,
  options?: UploadOptions,
): Promise<ReferenceResponse> {
  const identifier = makeSequentialFeedIdentifier(topic, index)
  const timestamp = makeBytes(8)
  const payloadBytes = serializeBytes(timestamp, reference)
  const cac = makeContentAddressedChunk(payloadBytes)
  const soc = await makeSingleOwnerChunk(cac, identifier, signer)
  const response = await uploadSingleOwnerChunk(url, soc, options)

  return response
}

function hexToNumber(s: string): number {
  const hex = verifyHex(s)
  const bytes = hexToBytes(hex)
  const bytes8 = verifyBytes(8, bytes)

  return readUint64BigEndian(bytes8)
}

export async function findNextIndex(url: string, owner: HexString, topic: HexString): Promise<number> {
  try {
    const feedUpdate = await findFeedUpdate(url, owner, topic)

    return hexToNumber(feedUpdate.feedIndexNext)
  } catch (e) {
    if (e instanceof BeeResponseError && e.status === 404) {
      return 0
    }
    throw e
  }
}

export async function updateFeed(
  url: string,
  signer: Signer,
  topic: Topic,
  reference: ChunkReference,
  options?: UploadOptions,
): Promise<ReferenceResponse> {
  const ownerHex = bytesToHex(signer.address)
  const topicHex = bytesToHex(topic)
  const nextIndex = await findNextIndex(url, ownerHex, topicHex)

  return uploadFeedUpdate(url, signer, topic, nextIndex, reference, options)
}

export interface FeedUpdate {
  timestamp: number
  reference: ChunkReference
}

function verifyChunkReferenceAtOffset(offset: number, data: Uint8Array): ChunkReference {
  try {
    return verifyBytesAtOffset(offset, REFERENCE_PAYLOAD_MAX_SIZE, data)
  } catch (e) {
    return verifyBytesAtOffset(offset, REFERENCE_PAYLOAD_MIN_SIZE, data)
  }
}

export async function downloadFeedUpdate(
  url: string,
  owner: EthAddress,
  topic: Topic,
  index: number,
): Promise<FeedUpdate> {
  const identifier = makeFeedIdentifier(topic, { type: 'sequence', value: index })
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

interface FeedReader {
  download(index: number): Promise<FeedUpdate>
  downloadLatest(): Promise<FeedUpdate>
  createManifest(): Promise<ReferenceResponse>
}

interface FeedWriter {
  upload(index: number, reference: ChunkReference, timestamp?: number, options?: UploadOptions): Promise<ReferenceResponse>
  uploadLatest(reference: ChunkReference, timestamp?: number, options?: UploadOptions): Promise<ReferenceResponse>
}
