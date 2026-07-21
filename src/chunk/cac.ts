import { Bytes } from '../utils/bytes'
import { Identifier, PrivateKey, Reference, Span } from '../utils/typed-bytes'
import { makeSingleOwnerChunk, SingleOwnerChunk } from './soc'
import { makeContentAddressedChunk as coreMake, unmarshalContentAddressedChunk as coreUnmarshal } from 'swarm-core'

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

function withToSingleOwnerChunk(core: { data: Uint8Array; span: Span; payload: Bytes; address: Reference }): Chunk {
  return {
    data: core.data,
    span: core.span,
    payload: core.payload,
    address: core.address,
    toSingleOwnerChunk: (identifier, signer) =>
      makeSingleOwnerChunk(core.address, core.span, core.payload, identifier, signer),
  }
}

export function unmarshalContentAddressedChunk(data: Bytes | Uint8Array): Chunk {
  return withToSingleOwnerChunk(coreUnmarshal(data instanceof Bytes ? data.toUint8Array() : data))
}

export function makeContentAddressedChunk(rawPayload: Bytes | Uint8Array | string, span?: Span | bigint): Chunk {
  return withToSingleOwnerChunk(coreMake(rawPayload, span))
}
