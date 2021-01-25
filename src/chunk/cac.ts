import { BrandedType } from '../types'
import { BeeError } from '../utils/error'
import { bmtHash } from './bmt'
import { Bytes, bytesAtOffset, bytesEqual, FlexBytes, flexBytesAtOffset, verifyFlexBytes } from '../utils/bytes'
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
  const address = () => bmtHash(data)

  return makeChunk(data, address)
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
