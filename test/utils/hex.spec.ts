import { bytesToHex, HexString, hexToBytes, isHexString, stripHexPrefix } from '../../src/utils/hex'

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

  const testBytes = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff])
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
})
