import { BeeArgumentError } from '../../src/utils/error'

export function makeSpan(length: number): Uint8Array {
  if (length <= 0) {
    throw new BeeArgumentError('invalid length for span', length)
  }

  // we limit the maximum span size in 32 bits to avoid BigInt compatibility issues
  if (length > 2 ** 32 - 1) {
    throw new BeeArgumentError('invalid length (> 2**32 - 1)', length)
  }

  const span = new Uint8Array(8)
  const dataView = new DataView(span.buffer)
  const littleEndian = true

  const lengthLower32 = length & 0xffffffff
  dataView.setUint32(0, lengthLower32, littleEndian)

  return span
}
