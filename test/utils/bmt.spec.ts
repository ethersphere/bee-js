import { bmtHash } from '../../src/utils/bmt'
import { beeUrl, byteArrayToHex, okResponse } from '../utils'
import * as chunk from '../../src/modules/chunk'
import { BeeArgumentError } from '../../src/utils/error'

function makeSpan(length: number): Uint8Array {
  if (length <= 0) {
    throw new BeeArgumentError('invalid length for span', length)
  }

  if (length > Number.MAX_SAFE_INTEGER) {
    throw new BeeArgumentError('invalid length (> Number.MAX_SAFE_INTEGER)', length)
  }

  const span = new ArrayBuffer(8)
  const dataView = new DataView(span)
  const littleEndian = true

  if (dataView.setBigUint64 !== undefined) {
    dataView.setBigUint64(0, BigInt(length), littleEndian)
  } else {
    const lengthLower32 = length & 0xffffffff
    dataView.setUint32(0, lengthLower32, littleEndian)
    const lengthUpper32 = length >> 32
    dataView.setUint32(4, lengthUpper32, littleEndian)
  }

  return new Uint8Array(span)
}

describe('span', () => {
  it('should construct correct span', () => {
    const expected: [number, Uint8Array][] = [
      [2 ** 0, new Uint8Array([0x01, 0, 0, 0, 0, 0, 0, 0])],
      [2 ** 4, new Uint8Array([0x10, 0, 0, 0, 0, 0, 0, 0])],
      [2 ** 8, new Uint8Array([0, 0x01, 0, 0, 0, 0, 0, 0])],
      [2 ** 16, new Uint8Array([0, 0, 0x01, 0, 0, 0, 0, 0])],
      [2 ** 24, new Uint8Array([0, 0, 0, 0x01, 0, 0, 0, 0])],
      [2 ** 32, new Uint8Array([0, 0, 0, 0, 0x01, 0, 0, 0])],
      [2 ** 40, new Uint8Array([0, 0, 0, 0, 0, 0x01, 0, 0])],
      [2 ** 48, new Uint8Array([0, 0, 0, 0, 0, 0, 0x01, 0])],
      [Number.MAX_SAFE_INTEGER, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0])],
    ]

    expected.forEach(elem => {
      const result = makeSpan(elem[0])
      expect(result).toEqual(elem[1])
    })
  })
})

describe('bmt', () => {
  it('should produce correct BMT hash', () => {
    const payload = new Uint8Array([1, 2, 3])
    // span is the payload length encoded as uint64 little endian
    const span = new Uint8Array([payload.length, 0, 0, 0, 0, 0, 0, 0])
    const data = new Uint8Array([...span, ...payload])
    // the hash is hardcoded because we would need the bmt hasher otherwise
    const hash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

    const result = bmtHash(data)

    expect(byteArrayToHex(result)).toEqual(hash)
  })

  it('should produce the same hash as Bee', async () => {
    /**
     * We upload chunks smaller than 4096 bytes on the /bytes
     * endpoint therefore it is stored in a single chunk.
     */
    for (let i = 1; i <= 4096; i *= 2) {
      const payload = new Uint8Array(i)
      const span = makeSpan(i)
      const data = new Uint8Array([...span, ...payload])

      const hash = byteArrayToHex(bmtHash(data))
      const response = await chunk.upload(beeUrl(), hash, data)
      expect(response).toEqual(okResponse)
    }
  })
})
