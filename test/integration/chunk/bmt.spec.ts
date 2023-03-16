import { expect } from 'chai'
import { bmtHash } from '../../../src/chunk/bmt'
import { makeSpan } from '../../../src/chunk/span'
import * as chunk from '../../../src/modules/chunk'
import { bytesToHex } from '../../../src/utils/hex'
import { beeKyOptions, getPostageBatch, randomByteArray } from '../../utils'

describe('bmt', () => {
  it('should produce the same hash as Bee', async function () {
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
      expect(response).to.eql(reference)
    }
  })

  it('should produce the same hash as Bee for random content', async function () {
    const payload = randomByteArray(4096)
    const span = makeSpan(payload.length)
    const data = new Uint8Array([...span, ...payload])

    const reference = bytesToHex(bmtHash(data))
    const response = await chunk.upload(beeKyOptions(), data, getPostageBatch())
    expect(response).to.eql(reference)
  })
})
