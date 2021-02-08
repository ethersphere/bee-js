import { Bytes, verifyBytes } from '../../src/utils/bytes'
import { makeSingleOwnerChunk, verifySingleOwnerChunk } from '../../src/chunk/soc'
import { makeContentAddressedChunk, verifyChunk } from '../../src/chunk/cac'
import { beeUrl, testIdentity } from '../utils'
import { makeDefaultSigner } from '../../src/chunk/signer'
import { uploadSingleOwnerChunk } from '../../src/chunk/upload'
import { serializeBytes } from '../../src/chunk/serialize'
import { makeSpan } from '../../src/chunk/span'
import * as chunkAPI from '../../src/modules/chunk'
import { HexString, hexToBytes, bytesToHex } from '../../src/utils/hex'

describe('soc', () => {
  const privateKey = verifyBytes(32, hexToBytes(testIdentity.privateKey))
  const signer = makeDefaultSigner(privateKey)
  const payload = new Uint8Array([1, 2, 3])
  const contentHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338' as HexString
  const socHash = '9d453ebb73b2fedaaf44ceddcf7a0aa37f3e3d6453fea5841c31f0ea6d61dc85' as HexString
  const identifier = new Uint8Array(32) as Bytes<32>

  test('content address chunk creation', () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()

    expect(bytesToHex(address)).toEqual(contentHash)
  })

  test('content address chunk verification', () => {
    const data = serializeBytes(makeSpan(payload.length), payload)
    const address = verifyBytes(32, hexToBytes(contentHash))
    const chunk = verifyChunk(data, address)
    const chunkAddress = chunk.address()

    expect(chunkAddress).toEqual(address)
  })

  test('upload content address chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const address = cac.address()
    const reference = bytesToHex(address)
    const response = await chunkAPI.upload(beeUrl(), cac.data)

    expect(response).toEqual({ reference })
  })

  test('download content address chunk', async () => {
    const data = await chunkAPI.download(beeUrl(), contentHash)
    const address = verifyBytes(32, hexToBytes(contentHash))
    const chunk = verifyChunk(data, address)
    const chunkAddress = chunk.address()

    expect(chunkAddress).toEqual(address)
  })

  test('single owner chunk creation', async () => {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const socAddress = bytesToHex(soc.address())
    const owner = soc.owner()

    expect(socAddress).toEqual(socHash)
    expect(owner).toEqual(signer.address)
  })

  test('upload single owner chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const socAddress = bytesToHex(soc.address())

    const response = await uploadSingleOwnerChunk(beeUrl(), soc)

    expect(response).toEqual({ reference: socAddress })
  })

  test('download single owner chunk', async () => {
    const data = await chunkAPI.download(beeUrl(), socHash)
    const address = verifyBytes(32, hexToBytes(socHash))
    const soc = verifySingleOwnerChunk(data, address)
    const socAddress = soc.address()

    expect(socAddress).toEqual(address)
  })
})
