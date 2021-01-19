import { Bytes, FlexBytes, verifyBytes, verifyFlexBytes } from './bytes'
import { bmtHash } from './bmt'
import { EthAddress, recoverAddress, sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { makeSpan } from './span'
import { serializeBytes } from './serialize'
import { BeeError } from '../utils/error'
import { BrandedType } from '../types'

const MIN_PAYLOAD_SIZE = 1
const MAX_PAYLOAD_SIZE = 4096

const SPAN_SIZE = 8
const IDENTIFIER_SIZE = 32
const SIGNATURE_SIZE = 65

const CAC_SPAN_OFFSET = 0
const CAC_PAYLOAD_OFFSET = CAC_SPAN_OFFSET + SPAN_SIZE

const SOC_IDENTIFIER_OFFSET = 0
const SOC_SIGNATURE_OFFSET = SOC_IDENTIFIER_OFFSET + IDENTIFIER_SIZE
const SOC_SPAN_OFFSET = SOC_SIGNATURE_OFFSET + SIGNATURE_SIZE
const SOC_PAYLOAD_OFFSET = SOC_SPAN_OFFSET + SPAN_SIZE

type ChunkAddress = Bytes<32>

/**
 * General chunk interface for Swarm
 *
 * It stores the serialized data and provides functions to access
 * the fields of a chunk.
 *
 * It also provides an address function to calculate the address of
 * the chunk that is required for the Chunk API.
 */
export interface Chunk {
  readonly data: Uint8Array
  span(): Bytes<8>
  payload(): FlexBytes<1, 4096>

  address(): ChunkAddress
}

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

type ValidChunkData = BrandedType<Uint8Array, 'ValidChunkData'>
type ValidSingleOwnerChunkData = BrandedType<Uint8Array, 'ValidSingleOwnerChunkData'>

type SpanReference = Bytes<32> | Bytes<64>

/**
 * Creates a content addressed chunk and verifies the payload size.
 *
 * @param payloadBytes the data to be stored in the chunk
 */
export function makeContentAddressedChunk(payloadBytes: Uint8Array): Chunk {
  const span = makeSpan(payloadBytes.length)
  const payload = verifyFlexBytes(MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, payloadBytes)
  const data = serializeBytes(span, payload) as ValidChunkData
  const address = () => bmtHash(data)

  return makeChunk(data, address)
}

/**
 * Creates intermediate chunk.
 *
 * Intermediate chunks are used to store data when the size
 * exceeds the maximum size of a single chunk.
 * @see MAX_PAYLOAD_SIZE
 * It encapsulates references to its children.
 *
 * @param spanLength  The length of the subtree below the intermediate chunk
 * @param references  The references to children chunks
 */
export function makeIntermediateChunk(spanLength: number, references: SpanReference[]): Chunk {
  if (spanLength < MAX_PAYLOAD_SIZE) {
    throw new BeeError('invalid spanLength (< 4096)')
  }
  const span = makeSpan(spanLength)
  const data = serializeBytes(span, ...references)
  const address = () => bmtHash(data)

  const minSize = SPAN_SIZE + MIN_PAYLOAD_SIZE
  const maxSize = SPAN_SIZE + MAX_PAYLOAD_SIZE
  verifyFlexBytes(minSize, maxSize, data)

  return makeChunk(data as ValidChunkData, address)
}

function makeChunk(data: ValidChunkData, address: () => ChunkAddress): Chunk {
  const span = () => bytesAtOffset(CAC_SPAN_OFFSET, SPAN_SIZE, data)
  const payload = () => flexBytesAtOffset(CAC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data)

  return {
    data,
    span,
    payload,
    address,
  }
}

/**
 * Type guard for valid content addressed chunk data
 *
 * @param data          The chunk data
 * @param chunkAddress  The address of the chunk
 */
export function isValidChunkData(data: Uint8Array, chunkAddress: ChunkAddress): data is ValidChunkData {
  const address = bmtHash(data)

  return bytesEqual(address, chunkAddress)
}

/**
 * Verifies if a chunk is a valid content addressed chunk
 *
 * @param data          The chunk data
 * @param chunkAddress  The address of the chunk
 *
 * @returns a valid content addressed chunk or throws error
 */
export function verifyChunk(data: Uint8Array, chunkAddress: ChunkAddress): Chunk {
  if (isValidChunkData(data, chunkAddress)) {
    return makeChunk(data, () => chunkAddress)
  }
  throw new BeeError('verifyChunk')
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

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
    return makeSingleOwnerChunkFromData(data, () => address)
  }
  throw new BeeError('verifySingleOwnerChunk')
}

function verifyBytesAtOffset<Length extends number>(offset: number, length: Length, data: Uint8Array): Bytes<Length> {
  return verifyBytes(length, bytesAtOffset(offset, length, data))
}

function bytesAtOffset<Length extends number>(offset: number, length: Length, data: Uint8Array): Bytes<Length> {
  return data.slice(offset, offset + length) as Bytes<Length>
}

function flexBytesAtOffset<Min extends number, Max extends number>(
  offset: number,
  _min: Min,
  _max: Max,
  data: Uint8Array,
): FlexBytes<Min, Max> {
  return data.slice(offset) as FlexBytes<Min, Max>
}

function makeSingleOwnerChunkFromData(data: ValidSingleOwnerChunkData, address: () => ChunkAddress): SingleOwnerChunk {
  const identifier = () => bytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
  const signature = () => bytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
  const span = () => bytesAtOffset(SOC_SPAN_OFFSET, SPAN_SIZE, data)
  const payload = () => flexBytesAtOffset(SOC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data)

  return {
    data,
    identifier,
    signature,
    span,
    payload,
    address,
  }
}

export function singleOwnerChunkAddress(identifier: Identifier, address: EthAddress): ChunkAddress {
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
  const address = () => keccak256Hash(identifier, signer.address)

  return makeSingleOwnerChunkFromData(data, address)
}
