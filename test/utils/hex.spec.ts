import { bytesToHex, HexString, hexToBytes, intToHex, isHexString, stripHexPrefix } from '../../src/utils/hex'

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
    test('chequebookaddress', () => {
      const input = '0x20d7855b548C71b69dA434D46187C336BDcef00F'
      const result = isHexString(input)

      expect(result).toBeTruthy()
    })
  })

  const testBytes = new Uint8Array([
    0x00,
    0x11,
    0x22,
    0x33,
    0x44,
    0x55,
    0x66,
    0x77,
    0x88,
    0x99,
    0xaa,
    0xbb,
    0xcc,
    0xdd,
    0xee,
    0xff,
  ])
  const testHex = '00112233445566778899aabbccddeeff' as HexString

  describe('hexToBytes', () => {
    test('converts hex to bytes', () => {
      const input = testHex
      const result = hexToBytes(input)

      expect(result).toEqual(testBytes)
    })
  })

  describe('bytesToHex', () => {
    test('converts bytes to hex', () => {
      const input = testBytes
      const result = bytesToHex(input)

      expect(result).toEqual(testHex)
    })
  })

  describe('intToHex', () => {
    const testValues = [
      { value: 1, result: '1' },
      { value: 1, result: '0x1', prefix: true },
      { value: 15, result: '0xf', prefix: true },
      { value: 16, result: '0x10', prefix: true },
      { value: 16, result: '10' },
      { value: 124, result: '7c' },
      { value: 28721856816, result: '6aff4c130' },
      { value: Number.MAX_SAFE_INTEGER, result: '1fffffffffffff' },
    ]

    testValues.forEach(({ value, result, prefix }) => {
      test(`should conver value ${value} to ${result}`, () => {
        expect(intToHex(value, prefix)).toBe(result)
      })
    })

    test('should throw for int value higher than MAX_SAFE_INTEGER', () => {
      expect(() => intToHex(Number.MAX_SAFE_INTEGER + 1)).toThrow()
    })

    test('should throw for non-positive or non-int', () => {
      const testValues = [124.1, 'a', '0', -1, () => {}, new Function()] // eslint-disable-line @typescript-eslint/no-empty-function
      testValues.forEach(value => expect(() => intToHex((value as unknown) as number)).toThrow())
    })
  })
})
