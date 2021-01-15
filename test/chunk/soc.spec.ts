import { Bytes, verifyBytes } from '../../src/chunk/bytes'
import {
  makeContentAddressedChunk,
  makeSingleOwnerChunk,
  verifyChunk,
  verifySingleOwnerChunk,
} from '../../src/chunk/soc'
import { beeUrl, fromHex, okResponse, toHex } from '../utils'
import { makeDefaultSigner } from '../../src/chunk/signer'
import { uploadChunk } from '../../src/chunk/upload'
import { serializeBytes } from '../../src/chunk/serialize'
import { makeSpan } from '../../src/chunk/span'
import * as chunkAPI from '../../src/modules/chunk'

const testIdentity = {
  privateKey: '0x1fea01178e263f89c7adc313534844d3e89c6df1adb2aa5f95337260ae149741',
  publicKey: '0x03b565dc7bbbd3d6f0b2d4021a4e89929b3b9357cdee735fbefd1dd9ffd94960b4',
  address: '0x18bb16b790bcb86772648423e0455343cbec79d5',
}

describe('soc', () => {
  const privateKey = verifyBytes(32, fromHex(testIdentity.privateKey))
  const signer = makeDefaultSigner(privateKey)
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'
  const socHash = '6bcf091786103a3d9a921d42f03d21c7def7f79fc95485debd4719374ae8609a'
  const identifier = new Uint8Array(32) as Bytes<32>

  test('content address chunk creation', () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()

    expect(toHex(address)).toEqual(contentHash)
  })

  test('content address chunk verification', () => {
    const data = serializeBytes(makeSpan(payload.length), payload)
    const address = verifyBytes(32, fromHex(contentHash))
    const chunk = verifyChunk(data, address)
    const chunkAddress = chunk.address()

    expect(chunkAddress).toEqual(address)
  })

  test('upload content address chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()
    const hash = toHex(address)
    const response = await chunkAPI.upload(beeUrl(), hash, cac.data)

    expect(response).toEqual(okResponse)
  })

  test('download content address chunk', async () => {
    const data = await chunkAPI.download(beeUrl(), contentHash)
    const address = verifyBytes(32, fromHex(contentHash))
    const chunk = verifyChunk(data, address)
    const chunkAddress = chunk.address()

    expect(chunkAddress).toEqual(address)
  })

  test('upload single owner chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const response = await uploadChunk(beeUrl(), soc)

    expect(response).toEqual(okResponse)
  })

  test('download single owner chunk', async () => {
    const data = await chunkAPI.download(beeUrl(), socHash)
    const address = verifyBytes(32, fromHex(socHash))
    const soc = verifySingleOwnerChunk(data, address)
    const socAddress = soc.address()

    expect(socAddress).toEqual(address)
  })
})
