import { isHexString, stripHexPrefix } from '../../src/utils/hex'

describe('hex', () => {
  describe('stripHexPrefix', () => {
    test('with prefix', () => {
      const input = '0xC0FFEE'
      const result = stripHexPrefix(input)

      expect(result).toBe('C0FFEE')
    })

    test('without prefix', () => {
      const input = 'C0FFEE'
      const result = stripHexPrefix(input)

      expect(result).toBe('C0FFEE')
    })

    test('empty string', () => {
      const result = stripHexPrefix('')

      expect(result).toBe('')
    })
  })

  describe('isHexString', () => {
    test('with hex string', () => {
      const input = 'C0FFEE'
      const result = isHexString(input)

      expect(result).toBeTruthy()
    })
    test('with not hex string', () => {
      const input = 'COFFEE'
      const result = isHexString(input)

      expect(result).toBeFalsy()
    })
    test('empty string', () => {
      const result = isHexString('')

      expect(result).toBeFalsy()
    })
  })
})
