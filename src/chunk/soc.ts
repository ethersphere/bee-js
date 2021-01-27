import { Bytes, bytesAtOffset, bytesEqual, flexBytesAtOffset, verifyBytes } from '../utils/bytes'
import { bmtHash } from './bmt'
import { EthAddress, recoverAddress, sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { SPAN_SIZE } from './span'
import { serializeBytes } from './serialize'
import { BeeError } from '../utils/error'
import { BeeResponse, BrandedType, UploadOptions } from '../types'
import { Chunk, ChunkAddress, MAX_PAYLOAD_SIZE, MIN_PAYLOAD_SIZE, verifyChunk } from './cac'

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
}

type ValidSingleOwnerChunkData = BrandedType<Uint8Array, 'ValidSingleOwnerChunkData'>

/**
 * Type guard for valid single owner chunk data
 *
 * @param data    The chunk data
 * @param address The address of the single owner chunk
 */
export function isValidSingleOwnerChunkData(
  data: Uint8Array,
  address: ChunkAddress,
): data is ValidSingleOwnerChunkData {
  try {
    const cacData = data.slice(SOC_SPAN_OFFSET)
    const chunkAddress = bmtHash(cacData)
    const signature = verifyBytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
    const identifier = verifyBytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
    const digest = keccak256Hash(identifier, chunkAddress)
    const accountAddress = recoverAddress(signature, digest)
    const socAddress = keccak256Hash(identifier, accountAddress)

    return bytesEqual(address, socAddress)
  } catch (e) {
    return false
  }
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
  if (isValidSingleOwnerChunkData(data, address)) {
    return makeSingleOwnerChunkFromData(data, address)
  }
  throw new BeeError('verifySingleOwnerChunk')
}

function verifyBytesAtOffset<Length extends number>(offset: number, length: Length, data: Uint8Array): Bytes<Length> {
  return verifyBytes(length, bytesAtOffset(offset, length, data))
}

function makeSingleOwnerChunkFromData(data: ValidSingleOwnerChunkData, chunkAddress: ChunkAddress): SingleOwnerChunk {
  const identifier = () => bytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
  const signature = () => bytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
  const span = () => bytesAtOffset(SOC_SPAN_OFFSET, SPAN_SIZE, data)
  const payload = () => flexBytesAtOffset(SOC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data)
  const address = () => chunkAddress

  return {
    data,
    identifier,
    signature,
    span,
    payload,
    address,
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
  const signature = await sign(digest, signer)
  const data = serializeBytes(identifier, signature, chunk.span(), chunk.payload()) as ValidSingleOwnerChunkData
  const address = keccak256Hash(identifier, signer.address)

  return makeSingleOwnerChunkFromData(data, address)
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
  upload: (Identifier: Identifier, data: Uint8Array, options?: UploadOptions) => Promise<BeeResponse>
}
