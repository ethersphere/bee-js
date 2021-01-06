import { bmtHash } from '../../src/utils/bmt'
import { byteArrayToHex } from '../utils'

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
})
