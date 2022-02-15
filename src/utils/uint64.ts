import { Bytes, makeBytes } from './bytes.js'

// TODO handle bigger values than 32 bit
// For now it's good enough because we only use these functions
// sequential feed indexes.
export function writeUint64LittleEndian(value: number, bytes: Bytes<8> = makeBytes(8)): Bytes<8> {
  const dataView = new DataView(bytes.buffer)
  const valueLower32 = value & 0xffffffff
  const littleEndian = true

  dataView.setUint32(0, valueLower32, littleEndian)
  dataView.setUint32(4, 0, littleEndian)

  return bytes
}

export function writeUint64BigEndian(value: number, bytes: Bytes<8> = makeBytes(8)): Bytes<8> {
  const dataView = new DataView(bytes.buffer)
  const valueLower32 = value & 0xffffffff

  dataView.setUint32(0, 0)
  dataView.setUint32(4, valueLower32)

  return bytes
}

export function readUint64BigEndian(bytes: Bytes<8>): number {
  const dataView = new DataView(bytes.buffer)

  return dataView.getUint32(4)
}
