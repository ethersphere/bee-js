/* eslint @typescript-eslint/no-empty-function: 0 */
import { ethToSwarmAddress, fromLittleEndian, isHexEthAddress, toLittleEndian } from '../../src/utils/eth'

describe('eth', () => {
  describe('isEthAddress', () => {
    const testValues = [
      { value: () => {}, result: false },
      { value: new Function(), result: false },
      { value: 'function', result: false },
      { value: {}, result: false },
      { value: '0xc6d9d2cd449a754c494264e1809c50e34d64562b', result: true },
      { value: '0xc6d9d2cd449a754c494264e1809c50e34d64562b'.toUpperCase(), result: true },
      { value: 'c6d9d2cd449a754c494264e1809c50e34d64562b', result: true },
      { value: 'c6d9d2cd449a754c494264e1809c50e34d64562b'.toUpperCase(), result: true },
      { value: 'E247A45c287191d435A8a5D72A7C8dc030451E9F', result: true },
      { value: '0xE247A45c287191d435A8a5D72A7C8dc030451E9F', result: true },
      { value: '0xE247a45c287191d435A8a5D72A7C8dc030451E9F', result: false },
      { value: '0xe247a45c287191d435a8a5d72a7c8dc030451e9f', result: true },
      { value: '0xE247A45C287191D435A8A5D72A7C8DC030451E9F', result: true },
      { value: '0XE247A45C287191D435A8A5D72A7C8DC030451E9F', result: true },
      { value: '1234567890123456789012345678901234567890', result: true },
      { value: 1234567890123456789012345678901234567890, result: false },
    ]

    testValues.forEach(({ value, result }) => {
      test(`should test if value ${value} is address: ${result}`, () => {
        expect(isHexEthAddress((value as unknown) as string)).toBe(result)
      })
    })
  })

  describe('toLittleEndian', () => {
    const testValues = [
      { value: '1', result: '01' },
      { value: 1, result: '01' },
      { value: '123', result: '2301' },
      { value: '0123', result: '2301' },
      { value: '0123', result: '230100', pad: 6 },
      { value: '0x0123', result: '230100', pad: 6 },
      { value: 124, result: '7c' },
      { value: 28721856816, result: '30c1f4af06' },
    ]

    testValues.forEach(({ value, result, pad }) => {
      test(`should conver value ${value}${pad ? ` with pad ${pad}` : ''} to ${result}`, () => {
        expect(toLittleEndian(value, pad)).toBe(result)
      })
    })

    const wrongTestValues = [124.1, -1, () => {}, new Function(), Number.MAX_SAFE_INTEGER + 1]

    wrongTestValues.forEach(value =>
      test(`should throw for non string or positive int values: ${value}`, () => {
        expect(() => toLittleEndian((value as unknown) as string)).toThrow()
      }),
    )
  })

  describe('fromLittleEndian', () => {
    const testValues = ['0123', '0x0123', 124, 28721856816]

    testValues.forEach(value => {
      test(`should conver value ${value} back and forth`, () => {
        // We are converting first time to make for the comparison value to be padded and of the same type
        const littleEndian1 = toLittleEndian(value)
        const bigEndian = fromLittleEndian(littleEndian1)
        const littleEndian2 = fromLittleEndian(bigEndian)

        expect(littleEndian1).toBe(littleEndian2)
      })
    })

    testValues.forEach(value => {
      test(`should conver value ${value} back and forth with padding`, () => {
        // We are converting first time to make for the comparison value to be padded and of the same type
        const littleEndian1 = toLittleEndian(value, 10)
        const bigEndian = fromLittleEndian(littleEndian1, 10)
        const littleEndian2 = fromLittleEndian(bigEndian, 10)

        expect(littleEndian1).toBe(littleEndian2)
      })
    })
  })

  describe('ethToSwarmAddress', () => {
    const testValues = [
      {
        value: '1815cac638d1525b47f848daf02b7953e4edd15c',
        result: 'b003840cac8f71dc3e6025dbccae613fd107dcb2fb187808b54cab92cfdd8299',
      },
      {
        value: '0x1815cac638d1525b47f848daf02b7953e4edd15c',
        result: 'b003840cac8f71dc3e6025dbccae613fd107dcb2fb187808b54cab92cfdd8299',
      },
      {
        value: '0737e7c2e82fac12ca9e2bae01bea910593300e6',
        result: 'ba898f4dd93c5b29dc2d9daff3ef3d183fa6b5bfac9c23d975c0ee1fb06fcad9',
      },
      {
        value: 'd26bc1715e933bd5f8fad16310042f13abc16159',
        result: '8e186467e0ed20b73667b5353210c0e650401cde0461c25c6b3e4a1f636b8cb8',
      },
    ]

    testValues.forEach(({ value, result }) => {
      test(`should create from ${value} to ${result}`, () => {
        expect(ethToSwarmAddress(value)).toBe(result)
      })
    })

    const wrongTestValues = [
      {
        address: '1815cac638d1525b47f848daf02b7953e4edd15cf',
        netId: 1,
      },
      {
        address: '1815cac638d1525b47f848daf02b7953e4edd15c',
        netId: 0,
      },
      {
        address: '1815cac638d1525b47f848daf02b7953e4edd15c',
        netId: Number.MAX_SAFE_INTEGER + 1,
      },
      {
        address: '1815cac638d1525b47f848daf02b7953e4edd15c',
        netId: () => {},
      },
      {
        address: () => {},
        netId: 1,
      },
    ]

    wrongTestValues.forEach((address, netId) =>
      test(`should throw for incorrect values address ${address} netId ${netId}`, () => {
        expect(() => ethToSwarmAddress((address as unknown) as string, (netId as unknown) as number)).toThrow()
      }),
    )
  })
})
