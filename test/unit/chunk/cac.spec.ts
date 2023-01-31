import { assertBytes } from '../../../src/utils/bytes'
import { makeContentAddressedChunk, assertValidChunkData } from '../../../src/chunk/cac'
import { serializeBytes } from '../../../src/chunk/serialize'
import { makeSpan } from '../../../src/chunk/span'
import { hexToBytes, bytesToHex } from '../../../src/utils/hex'
import { expect } from 'chai'

describe('cac', () => {
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

  it('content address chunk creation', () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()

    expect(bytesToHex(address)).to.eql(contentHash)
  })

  it('content address chunk verification', () => {
    const validAddress = hexToBytes(contentHash)
    assertBytes(validAddress, 32)
    const invalidAddress = hexToBytes('ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4335')
    assertBytes(invalidAddress, 32)

    const data = serializeBytes(makeSpan(payload.length), payload)

    expect(() => assertValidChunkData(data, validAddress)).not.to.throw()
    expect(() => assertValidChunkData(data, invalidAddress)).to.throw()
  })
})
