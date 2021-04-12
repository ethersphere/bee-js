import { assertBytes } from '../../src/utils/bytes'
import { makeContentAddressedChunk, assertValidChunkData } from '../../src/chunk/cac'
import { beeUrl } from '../utils'
import { serializeBytes } from '../../src/chunk/serialize'
import { makeSpan } from '../../src/chunk/span'
import * as chunkAPI from '../../src/modules/chunk'
import { hexToBytes, bytesToHex } from '../../src/utils/hex'

describe('cac', () => {
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

  test('content address chunk creation', () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()

    expect(bytesToHex(address)).toEqual(contentHash)
  })

  test('content address chunk verification', () => {
    const validAddress = hexToBytes(contentHash)
    assertBytes(validAddress, 32)
    const invalidAddress = hexToBytes('ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4335')
    assertBytes(invalidAddress, 32)

    const data = serializeBytes(makeSpan(payload.length), payload)

    expect(() => assertValidChunkData(data, validAddress)).not.toThrow()
    expect(() => assertValidChunkData(data, invalidAddress)).toThrow()
  })

  test('upload content address chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()
    const reference = bytesToHex(address)
    const response = await chunkAPI.upload(beeUrl(), cac.data)

    expect(response).toEqual({ reference })
  })

  test('download content address chunk', async () => {
    const address = hexToBytes(contentHash)
    assertBytes(address, 32)
    const data = await chunkAPI.download(beeUrl(), contentHash)

    expect(() => assertValidChunkData(data, address)).not.toThrow()
  })
})
