import { assertBytes } from '../../../src/utils/bytes'
import { makeContentAddressedChunk, assertValidChunkData } from '../../../src/chunk/cac'
import { beeUrl, getPostageBatch } from '../../utils'
import * as chunkAPI from '../../../src/modules/chunk'
import { hexToBytes, bytesToHex } from '../../../src/utils/hex'

describe('cac', () => {
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

  test('upload content address chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()
    const reference = bytesToHex(address)
    const response = await chunkAPI.upload(beeUrl(), cac.data, getPostageBatch())

    expect(response).toEqual({ reference })
  })

  test('download content address chunk', async () => {
    const address = hexToBytes(contentHash)
    assertBytes(address, 32)
    const data = await chunkAPI.download(beeUrl(), contentHash)

    expect(() => assertValidChunkData(data, address)).not.toThrow()
  })
})
