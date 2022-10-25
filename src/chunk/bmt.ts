// For ESM compatibility
import pkg from 'js-sha3'
const { keccak256 } = pkg
import { BeeArgumentError } from '../utils/error'
import { keccak256Hash } from '../utils/hash'
import type { Bytes } from '../utils/bytes'

const MAX_CHUNK_PAYLOAD_SIZE = 4096
const SEGMENT_SIZE = 32
const SEGMENT_PAIR_SIZE = 2 * SEGMENT_SIZE
const HASH_SIZE = 32

/**
 * Calculate a Binary Merkle Tree hash for a chunk
 *
 * The BMT chunk address is the hash of the 8 byte span and the root
 * hash of a binary Merkle tree (BMT) built on the 32-byte segments
 * of the underlying data.
 *
 * If the chunk content is less than 4k, the hash is calculated as
 * if the chunk was padded with all zeros up to 4096 bytes.
 *
 * @param chunkContent Chunk data including span and payload as well
 *
 * @returns the keccak256 hash in a byte array
 */
export function bmtHash(chunkContent: Uint8Array): Bytes<32> {
  const span = chunkContent.slice(0, 8)
  const payload = chunkContent.slice(8)
  const rootHash = bmtRootHash(payload)
  const chunkHashInput = new Uint8Array([...span, ...rootHash])
  const chunkHash = keccak256Hash(chunkHashInput)

  return chunkHash
}

function bmtRootHash(payload: Uint8Array): Uint8Array {
  if (payload.length > MAX_CHUNK_PAYLOAD_SIZE) {
    throw new BeeArgumentError('invalid data length', payload)
  }

  // create an input buffer padded with zeros
  let input = new Uint8Array([...payload, ...new Uint8Array(MAX_CHUNK_PAYLOAD_SIZE - payload.length)])
  while (input.length !== HASH_SIZE) {
    const output = new Uint8Array(input.length / 2)

    // in each round we hash the segment pairs together
    for (let offset = 0; offset < input.length; offset += SEGMENT_PAIR_SIZE) {
      const hashNumbers = keccak256.array(input.slice(offset, offset + SEGMENT_PAIR_SIZE))
      output.set(hashNumbers, offset / 2)
    }

    input = output
  }

  return input
}
