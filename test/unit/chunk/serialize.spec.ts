import { serializeBytes } from '../../../src/chunk/serialize'
import { expect } from 'chai'

describe('serializeBytes', () => {
  it('serializes', () => {
    const a1 = new Uint8Array([1])
    const a2 = new Uint8Array([2])
    const a3 = new Uint8Array([3])
    const expectedResult = new Uint8Array([1, 2, 3])

    const result = serializeBytes(a1, a2, a3)

    expect(result).to.eql(expectedResult)
  })

  it('serializes chunk data with span', () => {
    const span = new Uint8Array(8)
    const payload = new Uint8Array(4096)
    const expectedResult = new Uint8Array(span.length + payload.length)

    const result = serializeBytes(span, payload)

    expect(result).to.eql(expectedResult)
  })
})
