import { makeSpan } from '../../../src/chunk/span'
import { BeeArgumentError } from '../../../src/utils/error'

describe('span', () => {
  it('should construct correct span', () => {
    const expected: [number, Uint8Array][] = [
      [2 ** 0, new Uint8Array([0x01, 0, 0, 0, 0, 0, 0, 0])],
      [2 ** 4, new Uint8Array([0x10, 0, 0, 0, 0, 0, 0, 0])],
      [2 ** 8, new Uint8Array([0, 0x01, 0, 0, 0, 0, 0, 0])],
      [2 ** 16, new Uint8Array([0, 0, 0x01, 0, 0, 0, 0, 0])],
      [2 ** 24, new Uint8Array([0, 0, 0, 0x01, 0, 0, 0, 0])],
      [2 ** 32 - 1, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0])],
    ]

    expected.forEach(elem => {
      const result = makeSpan(elem[0])
      expect(result).to.equal(elem[1])
    })
  })

  it('should throw error with negative length', () => {
    const length = -1
    const t = () => makeSpan(length)
    expect(t).toThrow(BeeArgumentError)
  })

  it('should throw error with zero length', () => {
    const length = 0
    const t = () => makeSpan(length)
    expect(t).toThrow(BeeArgumentError)
  })

  it('should throw error when it is too big', () => {
    const length = 2 ** 32
    const t = () => makeSpan(length)
    expect(t).toThrow(BeeArgumentError)
  })
})
