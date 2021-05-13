import { bmtHash } from '../../../src/chunk/bmt'
import { beeUrl, getPostageBatch, randomByteArray } from '../../utils'
import * as chunk from '../../../src/modules/chunk'
import { makeSpan } from '../../../src/chunk/span'
import { bytesToHex } from '../../../src/utils/hex'

describe('bmt', () => {
  beforeAll(async () => {
    // This will create the default batch if it is was not created before
    await getPostageBatch()
  }, 60000)

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
      const response = await chunk.upload(beeUrl(), data, await getPostageBatch())
      expect(response).toEqual({ reference })
    }
  })

  it('should produce the same hash as Bee for random content', async () => {
    const payload = randomByteArray(4096)
    const span = makeSpan(payload.length)
    const data = new Uint8Array([...span, ...payload])

    const reference = bytesToHex(bmtHash(data))
    const response = await chunk.upload(beeUrl(), data, await getPostageBatch())
    expect(response).toEqual({ reference })
  })
})
