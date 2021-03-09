import { Bytes, bytesAtOffset, bytesEqual, flexBytesAtOffset, verifyBytesAtOffset } from '../utils/bytes'
import { bmtHash } from './bmt'
import { EthAddress, recoverAddress, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { SPAN_SIZE } from './span'
import { serializeBytes } from './serialize'
import { BeeError } from '../utils/error'
import { Chunk, ChunkAddress, makeContentAddressedChunk, MAX_PAYLOAD_SIZE, MIN_PAYLOAD_SIZE, verifyChunk } from './cac'
import { ReferenceResponse, UploadOptions } from '../types'
import { bytesToHex } from '../utils/hex'
import * as socAPI from '../modules/soc'
import * as chunkAPI from '../modules/chunk'

const IDENTIFIER_SIZE = 32
const SIGNATURE_SIZE = 65

const SOC_IDENTIFIER_OFFSET = 0
const SOC_SIGNATURE_OFFSET = SOC_IDENTIFIER_OFFSET + IDENTIFIER_SIZE
const SOC_SPAN_OFFSET = SOC_SIGNATURE_OFFSET + SIGNATURE_SIZE
const SOC_PAYLOAD_OFFSET = SOC_SPAN_OFFSET + SPAN_SIZE

export type Identifier = Bytes<32>

/**
 * With single owner chunks, a user can assign arbitrary data to an
 * address and attest chunk integrity with their digital signature.
 *
 * This interface extends the Chunk interface so it has the same
 * properties, but the address calculation is based on the identifier
 * and the owner of the chunk.
 */
export interface SingleOwnerChunk extends Chunk {
  identifier: () => Identifier
  signature: () => Signature
  owner: () => EthAddress
}

/**
 * Interface for downloading single owner chunks
 */
export interface SOCReader {
  /**
   * Downloads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   */
  download: (identifier: Identifier) => Promise<SingleOwnerChunk>
}

/**
 * Interface for downloading and uploading single owner chunks
 */
export interface SOCWriter extends SOCReader {
  /**
   * Uploads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   * @param data        The chunk payload data
   * @param options     Upload options
   */
  upload: (identifier: Identifier, data: Uint8Array, options?: UploadOptions) => Promise<ReferenceResponse>
}

function recoverChunkOwner(data: Uint8Array): EthAddress {
  const cacData = data.slice(SOC_SPAN_OFFSET)
  const chunkAddress = bmtHash(cacData)
  const signature = verifyBytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
  const identifier = verifyBytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
  const digest = keccak256Hash(identifier, chunkAddress)
  const ownerAddress = recoverAddress(signature, digest)

  return ownerAddress
}

/**
 * Verifies if the data is a valid single owner chunk
 *
 * @param data    The chunk data
 * @param address The address of the single owner chunk
 *
 * @returns a single owner chunk or throws error
 */
export function verifySingleOwnerChunk(data: Uint8Array, address: ChunkAddress): SingleOwnerChunk {
  const ownerAddress = recoverChunkOwner(data)
  const identifier = verifyBytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
  const socAddress = keccak256Hash(identifier, ownerAddress)

  if (!bytesEqual(address, socAddress)) {
    throw new BeeError('verifySingleOwnerChunk')
  }

  return makeSingleOwnerChunkFromData(data, address, ownerAddress)
}

function makeSingleOwnerChunkFromData(
  data: Uint8Array,
  socAddress: ChunkAddress,
  ownerAddress: EthAddress,
): SingleOwnerChunk {
  const identifier = () => bytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
  const signature = () => bytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
  const span = () => bytesAtOffset(SOC_SPAN_OFFSET, SPAN_SIZE, data)
  const payload = () => flexBytesAtOffset(SOC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data)
  const address = () => socAddress
  const owner = () => ownerAddress

  return {
    data,
    identifier,
    signature,
    span,
    payload,
    address,
    owner,
  }
}

export function makeSOCAddress(identifier: Identifier, address: EthAddress): ChunkAddress {
  return keccak256Hash(identifier, address)
}

/**
 * Creates a single owner chunk object
 *
 * @param chunk       A chunk object used for the span and payload
 * @param identifier  The identifier of the chunk
 * @param signer      The singer interface for signing the chunk
 */
export async function makeSingleOwnerChunk(
  chunk: Chunk,
  identifier: Identifier,
  signer: Signer,
): Promise<SingleOwnerChunk> {
  const chunkAddress = chunk.address()
  verifyChunk(chunk.data, chunkAddress)

  const digest = keccak256Hash(identifier, chunkAddress)
  const signature = await signer.sign(digest)
  const data = serializeBytes(identifier, signature, chunk.span(), chunk.payload())
  const address = makeSOCAddress(identifier, signer.address)
  const soc = makeSingleOwnerChunkFromData(data, address, signer.address)

  return soc
}

/**
 * Helper function to upload a chunk.
 *
 * It uses the Chunk API and calculates the address before uploading.
 *
 * @param url       The url of the Bee service
 * @param chunk     A chunk object
 * @param options   Upload options
 */
export function uploadSingleOwnerChunk(
  url: string,
  chunk: SingleOwnerChunk,
  options?: UploadOptions,
): Promise<ReferenceResponse> {
  const owner = bytesToHex(chunk.owner())
  const identifier = bytesToHex(chunk.identifier())
  const signature = bytesToHex(chunk.signature())
  const data = serializeBytes(chunk.span(), chunk.payload())

  return socAPI.upload(url, owner, identifier, signature, data, options)
}

/**
 * Helper function to create and upload SOC.
 *
 * @param url         The url of the Bee service
 * @param signer      The singer interface for signing the chunk
 * @param identifier  The identifier of the chunk
 * @param data        The chunk data
 * @param options
 */
export async function uploadSingleOwnerChunkData(
  url: string,
  signer: Signer,
  identifier: Identifier,
  data: Uint8Array,
  options?: UploadOptions,
): Promise<ReferenceResponse> {
  const cac = makeContentAddressedChunk(data)
  const soc = await makeSingleOwnerChunk(cac, identifier, signer)

  return uploadSingleOwnerChunk(url, soc, options)
}

/**
 * Helper function to download SOC.
 *
 * @param url           The url of the Bee service
 * @param ownerAddress  The singer interface for signing the chunk
 * @param identifier    The identifier of the chunk
 */
export async function downloadSingleOwnerChunk(
  url: string,
  ownerAddress: EthAddress,
  identifier: Identifier,
): Promise<SingleOwnerChunk> {
  const address = makeSOCAddress(identifier, ownerAddress)
  const data = await chunkAPI.download(url, bytesToHex(address))

  return verifySingleOwnerChunk(data, address)
}
