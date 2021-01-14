import { Bytes, verifyBytes } from '../../src/chunk/bytes'
import { makeContentAddressedChunk, makeSingleOwnerChunk } from '../../src/chunk/soc'
import { beeUrl, fromHex, okResponse } from '../utils'
import { makeDefaultSigner } from '../../src/chunk/signer'
import { uploadChunk } from '../../src/chunk/upload'

const testIdentity = {
  privateKey: '0x1fea01178e263f89c7adc313534844d3e89c6df1adb2aa5f95337260ae149741',
  publicKey: '0x03b565dc7bbbd3d6f0b2d4021a4e89929b3b9357cdee735fbefd1dd9ffd94960b4',
  address: '0x18bb16b790bcb86772648423e0455343cbec79d5',
}

describe('soc', () => {
  const privateKey = verifyBytes(32, fromHex(testIdentity.privateKey))
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
