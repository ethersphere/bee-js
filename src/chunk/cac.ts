import { BrandedType } from '../types'
import { BeeError } from '../utils/error'
import { bmtHash } from './bmt'
import { Bytes, bytesEqual, FlexBytes, flexBytesAtOffset, verifyFlexBytes } from '../utils/bytes'
import { serializeBytes } from './serialize'
import { makeSpan, SPAN_SIZE } from './span'

export const MIN_PAYLOAD_SIZE = 1
export const MAX_PAYLOAD_SIZE = 4096

const CAC_SPAN_OFFSET = 0
const CAC_PAYLOAD_OFFSET = CAC_SPAN_OFFSET + SPAN_SIZE

export type ChunkAddress = Bytes<32>

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

type ValidChunkData = BrandedType<Uint8Array, 'ValidChunkData'>

/**
 * Creates a content addressed chunk and verifies the payload size.
 *
 * @param payloadBytes the data to be stored in the chunk
 */
export function makeContentAddressedChunk(payloadBytes: Uint8Array): Chunk {
  const span = makeSpan(payloadBytes.length)
  verifyFlexBytes(MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, payloadBytes)
  const data = serializeBytes(span, payloadBytes) as ValidChunkData

  return {
    data,
    span: () => span,
    payload: () => flexBytesAtOffset(CAC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data),
    address: () => bmtHash(data),
  }
}

/**
 * Type guard for valid content addressed chunk data
 *
 * @param data          The chunk data
 * @param chunkAddress  The address of the chunk
 */
export function isValidChunkData(data: unknown, chunkAddress: ChunkAddress): data is ValidChunkData {
  if (!(data instanceof Uint8Array)) return false

  const address = bmtHash(data)

  return bytesEqual(address, chunkAddress)
}

/**
 * Asserts if data are representing given address of its chunk.
 *
 * @param data          The chunk data
 * @param chunkAddress  The address of the chunk
 *
 * @returns a valid content addressed chunk or throws error
 */
export function assertValidChunkData(data: unknown, chunkAddress: ChunkAddress): asserts data is ValidChunkData {
  if (!isValidChunkData(data, chunkAddress)) {
    throw new BeeError('Address of content address chunk does not match given data!')
  }
}
