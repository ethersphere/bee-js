/* eslint @typescript-eslint/no-empty-function: 0 */
import { wrapBytesWithHelpers } from '../../../src/utils/bytes'
import {
  capitalizeAddressERC55,
  ethToSwarmAddress,
  fromLittleEndian,
  isHexEthAddress,
  JsonRPC,
  makeEthereumWalletSigner,
  toLittleEndian,
} from '../../../src/utils/eth'
import { HexString, hexToBytes } from '../../../src/utils/hex'

describe('eth', () => {
  describe('capitalizeAddressERC55', () => {
    it('should calculate checksum for address', () => {
      // All caps
      expect(capitalizeAddressERC55('0x52908400098527886E0F7030069857D2E4169EE7')).toBe(
        '0x52908400098527886E0F7030069857D2E4169EE7',
      )
      expect(capitalizeAddressERC55('0x8617E340B3D01FA5F11F306F4090FD50E238070D')).toBe(
        '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
      )
      // All Lower
      expect(capitalizeAddressERC55('0xde709f2102306220921060314715629080e2fb77')).toBe(
        '0xde709f2102306220921060314715629080e2fb77',
      )
      expect(capitalizeAddressERC55('0x27b1fdb04752bbc536007a920d24acb045561c26')).toBe(
        '0x27b1fdb04752bbc536007a920d24acb045561c26',
      )
      // Normal
      expect(capitalizeAddressERC55('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      )
      expect(capitalizeAddressERC55('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359')).toBe(
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      )
      expect(capitalizeAddressERC55('0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB')).toBe(
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
      )
      expect(capitalizeAddressERC55('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb')).toBe(
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
      )
    })
  })

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
      // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
      { value: 1234567890123456789012345678901234567890, result: false },
    ]

    testValues.forEach(({ value, result }) => {
      it(`should test if value ${value} is address: ${result}`, () => {
        expect(isHexEthAddress(value as unknown as string)).toBe(result)
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
      it(`should conver value ${value}${pad ? ` with pad ${pad}` : ''} to ${result}`, () => {
        expect(toLittleEndian(value, pad)).toBe(result)
      })
    })

    const wrongTestValues = [124.1, -1, () => {}, new Function(), Number.MAX_SAFE_INTEGER + 1]

    wrongTestValues.forEach(value =>
      it(`should throw for non string or positive int values: ${value}`, () => {
        expect(() => toLittleEndian(value as unknown as string)).toThrow()
      }),
    )
  })

  describe('fromLittleEndian', () => {
    const testValues = ['0123', '0x0123', 124, 28721856816]

    testValues.forEach(value => {
      it(`should conver value ${value} back and forth`, () => {
        // We are converting first time to make for the comparison value to be padded and of the same type
        const littleEndian1 = toLittleEndian(value)
        const bigEndian = fromLittleEndian(littleEndian1)
        const littleEndian2 = fromLittleEndian(bigEndian)

        expect(littleEndian1).toBe(littleEndian2)
      })
    })

    testValues.forEach(value => {
      it(`should conver value ${value} back and forth with padding`, () => {
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
      it(`should create from ${value} to ${result}`, () => {
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
      it(`should throw for incorrect values address ${address} netId ${netId}`, () => {
        expect(() => ethToSwarmAddress(address as unknown as string, netId as unknown as number)).toThrow()
      }),
    )
  })

  describe('makeEthereumWalletSigner', () => {
    const dataToSignBytes = hexToBytes('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' as HexString)
    const dataToSignWithHelpers = wrapBytesWithHelpers(dataToSignBytes)
    const expectedSignatureHex =
      '0x336d24afef78c5883b96ad9a62552a8db3d236105cb059ddd04dc49680869dc16234f6852c277087f025d4114c4fac6b40295ecffd1194a84cdb91bd571769491b' as HexString

    it('should detect valid interface', async function () {
      await expect(makeEthereumWalletSigner({})).rejects.toThrow()
      await expect(makeEthereumWalletSigner('' as unknown as JsonRPC)).rejects.toThrow(TypeError)
      await expect(makeEthereumWalletSigner(1 as unknown as JsonRPC)).rejects.toThrow(TypeError)
      await expect(makeEthereumWalletSigner(null as unknown as JsonRPC)).rejects.toThrow(TypeError)
      await expect(makeEthereumWalletSigner(undefined as unknown as JsonRPC)).rejects.toThrow(TypeError)
    })

    it('should request address if not specified', async function () {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(['0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a'])

      const signer = await makeEthereumWalletSigner({ request: providerMock } as JsonRPC)

      expect(signer.address).toStrictEqual(hexToBytes('f1B07aC6E91A423d9c3c834cc9d938E89E19334a'))
      expect(providerMock).toHaveBeenCalledWith({ method: 'eth_requestAccounts' })
    })

    it('should request signature when sign() is called', async function () {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(expectedSignatureHex)

      const signer = await makeEthereumWalletSigner(
        { request: providerMock } as JsonRPC,
        '0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a',
      )
      expect(await signer.sign(dataToSignWithHelpers)).toBe(expectedSignatureHex)
      expect(providerMock).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: [
          '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
          '0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a',
        ],
      })
    })

    it('should normalize hex prefix for address', async function () {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(expectedSignatureHex)

      const signer = await makeEthereumWalletSigner(
        { request: providerMock } as JsonRPC,
        'f1B07aC6E91A423d9c3c834cc9d938E89E19334a',
      )
      expect(await signer.sign(dataToSignWithHelpers)).toBe(expectedSignatureHex)
      expect(providerMock).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: [
          '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
          '0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a',
        ],
      })
    })

    it('should validate eth address', async function () {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(expectedSignatureHex)

      await expect(
        makeEthereumWalletSigner({ request: providerMock } as JsonRPC, '0x307aC6E91A423d9c3c834cc9d938E89E19334a'),
      ).rejects.toThrow(TypeError)
    })
  })
})
