import { bmtHash } from '../../../src/chunk/bmt'
import { beeKyOptions, getPostageBatch, randomByteArray } from '../../utils'
import * as chunk from '../../../src/modules/chunk'
import { makeSpan } from '../../../src/chunk/span'
import { bytesToHex } from '../../../src/utils/hex'

describe('bmt', () => {
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
      const response = await chunk.upload(beeKyOptions(), data, getPostageBatch())
      expect(response).toEqual(reference)
    }
  })

  it('should produce the same hash as Bee for random content', async () => {
    const payload = randomByteArray(4096)
    const span = makeSpan(payload.length)
    const data = new Uint8Array([...span, ...payload])

    const reference = bytesToHex(bmtHash(data))
    const response = await chunk.upload(beeKyOptions(), data, getPostageBatch())
    expect(response).toEqual(reference)
  })
})
