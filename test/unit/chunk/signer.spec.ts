import { makePrivateKeySigner, makeSigner, recoverAddress, sign } from '../../../src/chunk/signer'
import type { Signature, Signer } from '../../../src/types'
import { assertBytes, makeBytes, wrapBytesWithHelpers } from '../../../src/utils/bytes'
import { bytesToHex, HexString, hexToBytes } from '../../../src/utils/hex'
import { shorten, testIdentity } from '../../utils'

describe('signer', () => {
  const dataToSignBytes = hexToBytes('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' as HexString)
  const dataToSignWithHelpers = wrapBytesWithHelpers(dataToSignBytes)

  const expectedSignatureHex =
    '336d24afef78c5883b96ad9a62552a8db3d236105cb059ddd04dc49680869dc16234f6852c277087f025d4114c4fac6b40295ecffd1194a84cdb91bd571769491b' as HexString
  const expectedSignatureBytes = hexToBytes(expectedSignatureHex)

  it('default signer (same data as Bee Go client)', async function () {
    const privateKey = hexToBytes(testIdentity.privateKey)
    assertBytes(privateKey, 32)

    const signer = makePrivateKeySigner(privateKey)
    const signature = await signer.sign(dataToSignWithHelpers)

    expect(signature).toStrictEqual(expectedSignatureBytes)
  })

  it('recover address from signature', () => {
    const recoveredAddress = recoverAddress(expectedSignatureBytes as Signature, dataToSignWithHelpers)

    expect(bytesToHex(recoveredAddress)).toBe(testIdentity.address)
  })

  describe('makeSigner', () => {
    it('converts string', async function () {
      const signer = makeSigner(testIdentity.privateKey)
      const signature = await signer.sign(dataToSignWithHelpers)

      expect(bytesToHex(signer.address)).toBe(testIdentity.address)
      expect(signature).toStrictEqual(expectedSignatureBytes)
    })

    it('converts uintarray', async function () {
      const signer = makeSigner(hexToBytes(testIdentity.privateKey))
      const signature = await signer.sign(dataToSignWithHelpers)

      expect(bytesToHex(signer.address)).toBe(testIdentity.address)
      expect(signature).toStrictEqual(expectedSignatureBytes)
    })

    it('returns already signer object', () => {
      const zeroAddress = makeBytes(20)
      const signerLikeObject = {
        address: zeroAddress,
        sign: () => {
          // noop
        },
      }

      const signer = makeSigner(signerLikeObject)

      expect(signer.address).toBe(zeroAddress)
    })

    it('throws for invalid data', () => {
      const data = [
        null,
        123,
        { some: 'property' },
        undefined,
        Symbol.for('symbol'),
        { address: makeBytes(20), sign: 'not a function' },
        {
          address: makeBytes(10),
          sign: () => {
            // noop
          },
        },
      ]

      for (const el of data) {
        expect(() => {
          makeSigner(el)
        }).toThrow(TypeError)
      }
    })
  })

  describe('sign', () => {
    it('should wrap the digest with helpers', async function () {
      const signer = {
        sign: digest => {
          expect(digest).toHaveProperty('hex')
          expect(digest).toHaveProperty('text')
          expect(digest).toHaveProperty('json')

          return expectedSignatureHex
        },
        address: makeBytes(20),
      } as Signer

      const result = await sign(signer, dataToSignBytes)
      expect(result).toStrictEqual(expectedSignatureBytes)
    })

    function testSignerConversion(input: HexString, output: Uint8Array): void {
      it(`should convert sign result ${shorten(input)}`, async () => {
        const signer = {
          sign: () => {
            return input
          },
          address: makeBytes(20),
        } as Signer

        const result = await sign(signer, dataToSignBytes)
        expect(result).toStrictEqual(output)
      })
    }

    testSignerConversion(expectedSignatureHex, expectedSignatureBytes)
    testSignerConversion(`0x${expectedSignatureHex}`, expectedSignatureBytes)

    function testSignerThrowing(input: unknown): void {
      it(`should throw for invalid result ${shorten(input)}`, async () => {
        const signer = {
          sign: () => {
            return input
          },
          address: makeBytes(20),
        } as Signer

        await expect(sign(signer, dataToSignBytes)).rejects.toThrow(TypeError)
      })
    }

    testSignerThrowing('0x1234')
    testSignerThrowing('1234')
    testSignerThrowing('asd')
    testSignerThrowing(1)
    testSignerThrowing([])
    testSignerThrowing({})
  })
})
