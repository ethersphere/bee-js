import { makeContentAddressedChunk } from '../chunk/cac'
import { keccak256Hash } from '../chunk/hash'
import { serializeBytes } from '../chunk/serialize'
import { EthAddress, Signer } from '../chunk/signer'
import { Identifier, makeSingleOwnerChunk, verifySingleOwnerChunk } from '../chunk/soc'
import { uploadSingleOwnerChunk } from '../chunk/upload'
import { findFeedUpdate } from '../modules/feed'
import { ReferenceResponse, UploadOptions } from '../types'
import { Bytes, makeBytes, verifyBytesAtOffset } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { bytesToHex, HexString } from '../utils/hex'
import { readUint64BigEndian, writeUint64BigEndian } from '../utils/uint64'
import * as chunkAPI from '../modules/chunk'

export type Topic = Bytes<32>

export function makeSequentialFeedIdentifier(topic: Topic, index: number): Identifier {
  const indexBytes = writeUint64BigEndian(index)

  return keccak256Hash(topic, indexBytes)
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

export async function findNextIndex(url: string, owner: HexString, topic: HexString): Promise<number> {
  try {
    const feedUpdate = await findFeedUpdate(url, owner, topic)

    return feedUpdate.feedIndexNext
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
    return verifyBytesAtOffset(offset, 64, data)
  } catch (e) {
    return verifyBytesAtOffset(offset, 32, data)
  }
}

export async function downloadFeedUpdate(
  url: string,
  owner: EthAddress,
  topic: Topic,
  index: number,
): Promise<FeedUpdate> {
  const identifier = makeSequentialFeedIdentifier(topic, index)
  const address = keccak256Hash(identifier, owner)
  const addressHex = bytesToHex(address)
  const data = await chunkAPI.download(url, addressHex)
  const soc = verifySingleOwnerChunk(data, address)
  const payload = soc.payload()
  const timestampBytes = verifyBytesAtOffset(0, 8, payload)
  const timestamp = readUint64BigEndian(timestampBytes)
  const reference = verifyChunkReferenceAtOffset(8, data)

  return {
    timestamp,
    reference,
  }
}
