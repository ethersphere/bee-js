import { expect } from 'chai'
import { assertValidChunkData, makeContentAddressedChunk } from '../../../src/chunk/cac'
import * as chunkAPI from '../../../src/modules/chunk'
import { assertBytes } from '../../../src/utils/bytes'
import { bytesToHex, hexToBytes } from '../../../src/utils/hex'
import { beeKyOptions, getPostageBatch } from '../../utils'

describe('cac', () => {
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

  it('upload content address chunk', async function () {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()
    const reference = bytesToHex(address)
    const response = await chunkAPI.upload(beeKyOptions(), cac.data, getPostageBatch())

    expect(response).to.eql(reference)
  })

  it('download content address chunk', async function () {
    const address = hexToBytes(contentHash)
    assertBytes(address, 32)
    const data = await chunkAPI.download(beeKyOptions(), contentHash)

    expect(() => assertValidChunkData(data, address)).not.to.throw()
  })
})
