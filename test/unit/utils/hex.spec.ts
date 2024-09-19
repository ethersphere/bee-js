import { bytesToHex, HexString, hexToBytes, intToHex, isHexString, makeHexString } from '../../../src/utils/hex'

describe('hex', () => {
  // prettier-ignore
  const testBytes = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff])
  const testHex = '00112233445566778899aabbccddeeff' as HexString

  describe('makeHexString', () => {
    describe('strings', () => {
      it('should strip prefix from valid prefixed string', () => {
        const input = '0xC0fFEE'
        const result = makeHexString(input)

        expect(result).toBe('C0fFEE')
      })

      it('should return valid non prefixed string', () => {
        const input = 'C0FFEE'
        const result = makeHexString(input)

        expect(result).toBe('C0FFEE')
      })

      it('should throw for other non valid strings', () => {
        expect(() => makeHexString('')).toThrow(TypeError)
        expect(() => makeHexString('COFFEE')).toThrow(TypeError)
      })

      it('should validate length if specified', () => {
        expect(makeHexString('C0fFEE', 6)).toBe('C0fFEE')
        expect(makeHexString('0xC0fFEE', 6)).toBe('C0fFEE')
        expect(() => makeHexString('C0fFEE', 5)).toThrow(TypeError)
        expect(() => makeHexString('0xC0fFEE', 7)).toThrow(TypeError)
      })
    })
  })

  describe('isHexString', () => {
    function testCase(input: unknown, result: boolean): void {
      it(`should ${result ? 'accept' : 'reject'} input: ${input}`, () => {
        expect(isHexString(input)).toBe(result)
      })
    }

    testCase('C0FFEE', true)
    testCase('123C0FFEE', true)
    testCase('ZACOFFEE', false)
    testCase('', false)
    testCase(undefined, false)
    testCase(null, false)
    testCase(1, false)
    testCase({}, false)
    testCase([], false)

    it('should validate length if specified', () => {
      expect(isHexString('C0FFEE', 6)).toBe(true)
      expect(isHexString('C0FFEE', 7)).toBe(false)
    })

    it('chequebookaddress', () => {
      const input = '20d7855b548C71b69dA434D46187C336BDcef00F'
      const result = isHexString(input)

      expect(result).toBeTruthy()
    })
  })

  describe('hexToBytes', () => {
    it('converts hex to bytes', () => {
      const input = testHex
      const result = hexToBytes(input)

      expect(result).toStrictEqual(testBytes)
    })
  })

  describe('bytesToHex', () => {
    it('converts bytes to hex', () => {
      const input = testBytes
      const result = bytesToHex(input)

      expect(result).toBe(testHex)
    })
  })

  describe('intToHex', () => {
    const testValues = [
      { value: 1, result: '1' },
      { value: 1, result: '1', length: 1 },
      { value: 15, length: 2, throws: TypeError },
      { value: 16, result: '10', length: 2 },
      { value: 16, result: '10' },
      { value: 124, result: '7c' },
      { value: 28721856816, result: '6aff4c130' },
      { value: Number.MAX_SAFE_INTEGER, result: '1fffffffffffff' },
      { value: Number.MAX_SAFE_INTEGER + 1, throws: TypeError },
      { value: 124.1, throws: TypeError },
      { value: 'a', throws: TypeError },
      { value: '0', throws: TypeError },
      { value: -1, throws: TypeError },
    ]

    testValues.forEach(({ value, result, length, throws }) => {
      if (throws) {
        it(`should throw error for value ${value}`, () => {
          expect(() => intToHex(value as number, length)).toThrow(throws)
        })
      } else {
        it(`should convert value ${value} to ${result}`, () => {
          expect(intToHex(value as number, length)).toBe(result)
        })
      }
    })
  })
})
