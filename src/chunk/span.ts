import { Binary } from 'cafe-utility'
import { Bytes } from '../utils/bytes'
import { BeeArgumentError } from '../utils/error'

export const SPAN_SIZE = 8

// we limit the maximum span size in 32 bits to avoid BigInt compatibility issues
const MAX_SPAN_LENGTH = 2 ** 32 - 1

/**
 * Create a span for storing the length of the chunk
 *
 * The length is encoded in 64-bit little endian.
 *
 * @param length The length of the span
 */
export function makeSpan(length: number): Bytes<8> {
  if (length <= 0) {
    throw new BeeArgumentError('invalid length for span', length)
  }

  if (length > MAX_SPAN_LENGTH) {
    throw new BeeArgumentError('invalid length (> MAX_SPAN_LENGTH)', length)
  }

  return Binary.numberToUint64LE(length) as Bytes<8>
}
