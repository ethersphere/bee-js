import { Bytes } from '../../src/chunk/bytes'
import { makeContentAddressedChunk, makeSingleOwnerChunk, serializeBytes } from '../../src/chunk/soc'
import { HexString, hexToUint8Array } from '../../src/utils/hex'
import { beeUrl, okResponse } from '../utils'
import { makeDefaultSigner } from '../../src/chunk/signer'
import { uploadChunk } from '../../src/chunk/upload'

const testIdentity = {
  privateKey: '0x1fea01178e263f89c7adc313534844d3e89c6df1adb2aa5f95337260ae149741',
  publicKey: '0x03b565dc7bbbd3d6f0b2d4021a4e89929b3b9357cdee735fbefd1dd9ffd94960b4',
  address: '0x18bb16b790bcb86772648423e0455343cbec79d5',
}

describe('serializeBytes', () => {
  it('serializes', () => {
    const a1 = new Uint8Array([1])
    const a2 = new Uint8Array([2])
    const a3 = new Uint8Array([3])
    const expectedResult = new Uint8Array([1, 2, 3])

    const result = serializeBytes(a1, a2, a3)

    expect(result).toEqual(expectedResult)
  })

  it('serializes2', () => {
    const span = new Uint8Array(8)
    const payload = new Uint8Array(4096)
    const expectedResult = new Uint8Array(span.length + payload.length)

    const result = serializeBytes(span, payload)

    expect(result).toEqual(expectedResult)
  })

})

describe('soc', () => {
  const privateKey = hexToUint8Array(testIdentity.privateKey as HexString)
  const signer = makeDefaultSigner(privateKey)

  it('upload content address chunk', async () => {
    const payload = new Uint8Array([1, 2, 3])
    const identifier = new Uint8Array(32) as Bytes<32>
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const response = await uploadChunk(beeUrl(), soc)

    expect(response).toEqual(okResponse)
  })
})
