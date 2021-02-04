import { bmtHash } from '../../src/chunk/bmt'
import { beeUrl, okResponse, randomByteArray } from '../utils'
import * as chunk from '../../src/modules/chunk'
import { makeSpan } from '../../src/chunk/span'
import { bytesToHex } from '../../src/utils/hex'

describe('bmt', () => {
  it('should produce correct BMT hash', () => {
    const payload = new Uint8Array([1, 2, 3])
    const span = makeSpan(payload.length)
    const data = new Uint8Array([...span, ...payload])
    const hash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

    const result = bmtHash(data)

    expect(bytesToHex(result)).toEqual(hash)
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

      const reference = bytesToHex(bmtHash(data))
      const response = await chunk.upload(beeUrl(), reference, data)
      expect(response).toEqual( { reference })
    }
  })

  it('should produce the same hash as Bee for random content', async () => {
    const payload = randomByteArray(4096)
    const span = makeSpan(payload.length)
    const data = new Uint8Array([...span, ...payload])

    const reference = bytesToHex(bmtHash(data))
    const response = await chunk.upload(beeUrl(), reference, data)
    expect(response).toEqual( { reference })
})
})
