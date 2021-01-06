import { keccak256 } from 'js-sha3'
import { BeeArgumentError } from './error'

const MAX_CHUNK_PAYLOAD_SIZE = 4096
const SEGMENT_SIZE = 32
const HASH_SIZE = 32

export function bmtHash(chunkContent: Uint8Array): Uint8Array {
  const span = chunkContent.slice(0, 8)
  const payload = chunkContent.slice(8)
  const rootHash = bmtRootHash(payload)
  const chunkHashInput = new Uint8Array([...span, ...rootHash])
  const chunkHash = keccak256.array(chunkHashInput)

  return Uint8Array.from(chunkHash)
}

function bmtRootHash(data: Uint8Array): Uint8Array {
  if (data.length > MAX_CHUNK_PAYLOAD_SIZE) {
    throw new BeeArgumentError('invalid data length', data)
  }

  // create an input buffer padded with zeros
  let input = new Uint8Array([...data, ...new Uint8Array(MAX_CHUNK_PAYLOAD_SIZE - data.length)])
  while (input.length > HASH_SIZE) {
    const output = new Uint8Array(input.length / 2)

    // in each round we hash the pairs together
    for (let offset = 0; offset < input.length; offset += SEGMENT_SIZE * 2) {
      const hashNumbers = keccak256.array(input.slice(offset, offset + SEGMENT_SIZE * 2))
      output.set(hashNumbers, offset / 2)
    }

    input = output
  }

  return input
}
