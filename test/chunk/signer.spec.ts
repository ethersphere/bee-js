import { sign, makePrivateKeySigner, makeSigner, recoverAddress } from '../../src/chunk/signer'
import { makeBytes, assertBytes, wrapBytesWithHelpers } from '../../src/utils/bytes'
import { HexString, hexToBytes, bytesToHex } from '../../src/utils/hex'
import { shorten, testIdentity } from '../utils'
import type { Signature, Signer } from '../../src/types'

describe('signer', () => {
  const dataToSignBytes = hexToBytes('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' as HexString)
  const dataToSignWithHelpers = wrapBytesWithHelpers(dataToSignBytes)

  const expectedSignatureHex = '336d24afef78c5883b96ad9a62552a8db3d236105cb059ddd04dc49680869dc16234f6852c277087f025d4114c4fac6b40295ecffd1194a84cdb91bd571769491b' as HexString
  const expectedSignatureBytes = hexToBytes(expectedSignatureHex)

  test('default signer (same data as Bee Go client)', async () => {
    const privateKey = hexToBytes(testIdentity.privateKey)
    assertBytes(privateKey, 32)

    const signer = makePrivateKeySigner(privateKey)
    const signature = await signer.sign(dataToSignWithHelpers)

    expect(signature).toEqual(expectedSignatureBytes)
  })

  test('recover address from signature', () => {
    const recoveredAddress = recoverAddress(expectedSignatureBytes as Signature, dataToSignWithHelpers)

    expect(bytesToHex(recoveredAddress)).toEqual(testIdentity.address)
  })

  describe('makeSigner', () => {
    test('converts string', async () => {
      const signer = makeSigner(testIdentity.privateKey)
      const signature = await signer.sign(dataToSignWithHelpers)

      expect(bytesToHex(signer.address)).toEqual(testIdentity.address)
      expect(signature).toEqual(expectedSignatureBytes)
    })

    test('converts uintarray', async () => {
      const signer = makeSigner(hexToBytes(testIdentity.privateKey))
      const signature = await signer.sign(dataToSignWithHelpers)

      expect(bytesToHex(signer.address)).toEqual(testIdentity.address)
      expect(signature).toEqual(expectedSignatureBytes)
    })

    test('returns already signer object', () => {
      const zeroAddress = makeBytes(20)
      const signerLikeObject = {
        address: zeroAddress,
        sign: () => {
          // noop
        },
      }

      const signer = makeSigner(signerLikeObject)

      expect(signer.address).toEqual(zeroAddress)
    })

    test('throws for invalid data', () => {
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
    it('should wrap the digest with helpers', async () => {
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
      expect(result).toEqual(expectedSignatureBytes)
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
        expect(result).toEqual(output)
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
