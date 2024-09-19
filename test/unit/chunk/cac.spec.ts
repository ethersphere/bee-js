import { Binary } from 'cafe-utility'
import { assertValidChunkData, makeContentAddressedChunk } from '../../../src/chunk/cac'
import { makeSpan } from '../../../src/chunk/span'
import { assertBytes } from '../../../src/utils/bytes'
import { bytesToHex, hexToBytes } from '../../../src/utils/hex'

describe('cac', () => {
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

  it('content address chunk creation', () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()

    expect(bytesToHex(address)).toBe(contentHash)
  })

  it('content address chunk verification', () => {
    const validAddress = hexToBytes(contentHash)
    assertBytes(validAddress, 32)
    const invalidAddress = hexToBytes('ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4335')
    assertBytes(invalidAddress, 32)

    const data = Binary.concatBytes(makeSpan(payload.length), payload)

    expect(() => assertValidChunkData(data, validAddress)).toBeTruthy()
    expect(() => assertValidChunkData(data, invalidAddress)).toThrow()
  })
})
