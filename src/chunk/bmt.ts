import { Binary } from 'cafe-utility'
import { keccak } from 'hash-wasm'
import { BeeArgumentError } from '../utils/error'
import { Reference, Span } from '../utils/typed-bytes'

const MAX_CHUNK_PAYLOAD_SIZE = 4096
const SEGMENT_SIZE = 32

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
export async function calculateChunkAddress(chunkContent: Uint8Array): Promise<Reference> {
  const span = chunkContent.slice(0, Span.LENGTH)
  const payload = chunkContent.slice(Span.LENGTH)
  const rootHash = await calculateBmtRootHash(payload)
  const chunkHash = await keccak(Binary.concatBytes(span, rootHash), 256)

  return new Reference(Binary.hexToUint8Array(chunkHash))
}

async function calculateBmtRootHash(payload: Uint8Array): Promise<Uint8Array> {
  if (payload.length > MAX_CHUNK_PAYLOAD_SIZE) {
    throw new BeeArgumentError(
      `payload size ${payload.length} exceeds maximum chunk payload size ${MAX_CHUNK_PAYLOAD_SIZE}`,
      payload,
    )
  }
  const input = new Uint8Array(MAX_CHUNK_PAYLOAD_SIZE)
  input.set(payload)

  return Binary.log2Reduce(Binary.partition(input, SEGMENT_SIZE), async (a, b) => {
    const hash = await keccak(Binary.concatBytes(a, b), 256)
    return Binary.hexToUint8Array(hash)
  })
}
