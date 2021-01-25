import { verifyBytes } from '../../src/utils/bytes'
import { makeDefaultSigner, recoverAddress, sign, Signature } from '../../src/chunk/signer'
import { HexString, hexToBytes, bytesToHex } from '../../src/utils/hex'
import { testIdentity } from '../utils'

describe('signer', () => {
  const dataToSign = hexToBytes('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' as HexString)
  const expectedSignature = hexToBytes(
    '336d24afef78c5883b96ad9a62552a8db3d236105cb059ddd04dc49680869dc16234f6852c277087f025d4114c4fac6b40295ecffd1194a84cdb91bd571769491b' as HexString,
  )

  test('default signer (same data as Bee Go client)', async () => {
    const privateKey = verifyBytes(32, hexToBytes(testIdentity.privateKey))
    const signer = makeDefaultSigner(privateKey)
    const signature = await sign(dataToSign, signer)

    expect(signature).toEqual(expectedSignature)
  })

  test('recover address from signature', () => {
    const recoveredAddress = recoverAddress(expectedSignature as Signature, dataToSign)

    expect(bytesToHex(recoveredAddress, true)).toEqual(testIdentity.address)
  })
})
