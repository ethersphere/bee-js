/* eslint @typescript-eslint/no-empty-function: 0 */
import {
  createEthereumWalletSigner,
  ethToSwarmAddress,
  fromLittleEndian,
  isHexEthAddress,
  JsonRPC,
  toLittleEndian,
} from '../../src/utils/eth'
import { HexString, hexToBytes } from '../../src/utils/hex'
import { wrapBytesWithHelpers } from '../../src/utils/bytes'

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

  describe('createEthereumWalletSigner', () => {
    const dataToSignBytes = hexToBytes('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' as HexString)
    const dataToSignWithHelpers = wrapBytesWithHelpers(dataToSignBytes)
    const expectedSignatureHex = '0x336d24afef78c5883b96ad9a62552a8db3d236105cb059ddd04dc49680869dc16234f6852c277087f025d4114c4fac6b40295ecffd1194a84cdb91bd571769491b' as HexString

    it('should detect valid interface', async () => {
      await expect(createEthereumWalletSigner({})).rejects.toThrow()
      await expect(createEthereumWalletSigner(('' as unknown) as JsonRPC)).rejects.toThrow(TypeError)
      await expect(createEthereumWalletSigner((1 as unknown) as JsonRPC)).rejects.toThrow(TypeError)
      await expect(createEthereumWalletSigner((null as unknown) as JsonRPC)).rejects.toThrow(TypeError)
      await expect(createEthereumWalletSigner((undefined as unknown) as JsonRPC)).rejects.toThrow(TypeError)
    })

    it('should request address if not specified', async () => {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(['0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a'])

      const signer = await createEthereumWalletSigner({ request: providerMock } as JsonRPC)

      expect(signer.address).toEqual(hexToBytes('f1B07aC6E91A423d9c3c834cc9d938E89E19334a'))
      expect(providerMock.mock.calls.length).toEqual(1)
      expect(providerMock.mock.calls[0][0]).toEqual({ method: 'eth_requestAccounts' })
    })

    it('should request signature when sign() is called', async () => {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(expectedSignatureHex)

      const signer = await createEthereumWalletSigner(
        { request: providerMock } as JsonRPC,
        '0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a',
      )
      await expect(signer.sign(dataToSignWithHelpers)).resolves.toEqual(expectedSignatureHex)
      expect(providerMock.mock.calls.length).toEqual(1)
      expect(providerMock.mock.calls[0][0]).toEqual({
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: [
          '0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a',
          '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        ],
      })
    })

    it('should normalize hex prefix for address', async () => {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(expectedSignatureHex)

      const signer = await createEthereumWalletSigner(
        { request: providerMock } as JsonRPC,
        'f1B07aC6E91A423d9c3c834cc9d938E89E19334a',
      )
      await expect(signer.sign(dataToSignWithHelpers)).resolves.toEqual(expectedSignatureHex)
      expect(providerMock.mock.calls.length).toEqual(1)
      expect(providerMock.mock.calls[0][0]).toEqual({
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: [
          '0xf1B07aC6E91A423d9c3c834cc9d938E89E19334a',
          '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        ],
      })
    })

    it('should validate eth address', async () => {
      const providerMock = jest.fn()
      providerMock.mockReturnValue(expectedSignatureHex)

      await expect(
        createEthereumWalletSigner({ request: providerMock } as JsonRPC, '0x307aC6E91A423d9c3c834cc9d938E89E19334a'),
      ).rejects.toThrow(TypeError)
    })
  })
})
