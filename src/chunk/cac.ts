import { Binary, Types } from 'cafe-utility'
import { Bytes } from '../utils/bytes'
import { Identifier, PrivateKey, Reference, Span } from '../utils/typed-bytes'
import { calculateChunkAddress } from './bmt'
import { makeSingleOwnerChunk, SingleOwnerChunk } from './soc'

export const MIN_PAYLOAD_SIZE = 1
export const MAX_PAYLOAD_SIZE = 4096

/**
 * Content Addressed Chunk (CAC) is the immutable building block of Swarm,
 * holding at most 4096 bytes of payload.
 *
 * - `span` indicates the size of the `payload` in bytes.
 * - `payload` contains the actual data or the body of the chunk.
 * - `data` contains the full chunk data - `span` and `payload`.
 * - `address` is the Swarm hash (or reference) of the chunk.
 *
 * The `toSingleOwnerChunk` method allows converting the CAC into a Single Owner Chunk (SOC).
 */
export interface Chunk {
  /**
   * Contains the full chunk data - `span` + `payload`.
   */
  readonly data: Uint8Array
  /**
   * Indicates the size of the `payload` in bytes.
   */
  span: Span
  /**
   * Contains the actual data or the body of the chunk.
   */
  payload: Bytes
  /**
   * The Swarm hash (or reference) of the chunk.
   */
  address: Reference
  /**
   * Converts the CAC into a Single Owner Chunk (SOC).
   */
  toSingleOwnerChunk: (
    identifier: Identifier | Uint8Array | string,
    signer: PrivateKey | Uint8Array | string,
  ) => SingleOwnerChunk
}

export function makeContentAddressedChunk(rawPayload: Bytes | Uint8Array | string): Chunk {
  if (Types.isString(rawPayload)) {
    rawPayload = Bytes.fromUtf8(rawPayload)
  }

  if (rawPayload.length < MIN_PAYLOAD_SIZE || rawPayload.length > MAX_PAYLOAD_SIZE) {
    throw new RangeError(`payload size ${rawPayload.length} exceeds limits [${MIN_PAYLOAD_SIZE}, ${MAX_PAYLOAD_SIZE}]`)
  }

  const span = Span.fromBigInt(BigInt(rawPayload.length))
  const payload = new Bytes(rawPayload)
  const data = Binary.concatBytes(span.toUint8Array(), payload.toUint8Array())
  const address = calculateChunkAddress(data)

  return {
    data,
    span,
    payload,
    address,
    toSingleOwnerChunk: (identifier: Identifier | Uint8Array | string, signer: PrivateKey | Uint8Array | string) => {
      return makeSingleOwnerChunk(address, span, payload, identifier, signer)
    },
  }
}
