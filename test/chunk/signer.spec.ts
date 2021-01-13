import { makeDefaultSigner, sign } from '../../src/chunk/signer'
import { HexString, hexToUint8Array } from '../../src/utils/hex'

describe('singer', () => {
  test('default signer', async () => {
    const privateKey = hexToUint8Array('634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd' as HexString)
    const dataToSign = hexToUint8Array('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' as HexString)
    const signer = makeDefaultSigner(privateKey)
    const signature = await sign(dataToSign, signer)
    const expectedSignature = hexToUint8Array(
      '336d24afef78c5883b96ad9a62552a8db3d236105cb059ddd04dc49680869dc16234f6852c277087f025d4114c4fac6b40295ecffd1194a84cdb91bd571769491b' as HexString,
    )

    expect(signature).toEqual(expectedSignature)
  })
})
