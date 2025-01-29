import { Binary } from 'cafe-utility'
import { Bytes } from '../utils/bytes'
import { Reference, Span } from '../utils/typed-bytes'
import { calculateChunkAddress } from './bmt'

export const MIN_PAYLOAD_SIZE = 1
export const MAX_PAYLOAD_SIZE = 4096

const ENCODER = new TextEncoder()

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
  span: Span
  payload: Bytes
  address: Reference
}

/**
 * Creates a content addressed chunk and verifies the payload size.
 *
 * @param payloadBytes the data to be stored in the chunk
 */
export function makeContentAddressedChunk(payloadBytes: Uint8Array | string): Chunk {
  if (!(payloadBytes instanceof Uint8Array)) {
    payloadBytes = ENCODER.encode(payloadBytes)
  }

  if (payloadBytes.length < MIN_PAYLOAD_SIZE || payloadBytes.length > MAX_PAYLOAD_SIZE) {
    throw new RangeError(
      `payload size ${payloadBytes.length} exceeds limits [${MIN_PAYLOAD_SIZE}, ${MAX_PAYLOAD_SIZE}]`,
    )
  }

  const span = Span.fromBigInt(BigInt(payloadBytes.length))
  const data = Binary.concatBytes(span.toUint8Array(), payloadBytes)

  return {
    data,
    span,
    payload: Bytes.fromSlice(data, Span.LENGTH),
    address: calculateChunkAddress(data),
  }
}
