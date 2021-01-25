import { BeeArgumentError } from '../../src/utils/error'
import { Bytes } from '../utils/bytes'

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

  const span = new Uint8Array(SPAN_SIZE)
  const dataView = new DataView(span.buffer)
  const littleEndian = true
  const lengthLower32 = length & 0xffffffff

  dataView.setUint32(0, lengthLower32, littleEndian)

  return span as Bytes<8>
}
