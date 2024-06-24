import { expect } from 'chai'
import { makeContentAddressedChunk } from '../../../src/chunk/cac'
import { makePrivateKeySigner } from '../../../src/chunk/signer'
import { makeSingleOwnerChunk, makeSingleOwnerChunkFromData, uploadSingleOwnerChunk } from '../../../src/chunk/soc'
import * as chunkAPI from '../../../src/modules/chunk'
import { Bytes, assertBytes } from '../../../src/utils/bytes'
import { HexString, bytesToHex, hexToBytes } from '../../../src/utils/hex'
import { beeKyOptions, getPostageBatch, testIdentity } from '../../utils'

describe('soc', () => {
  const privateKey = hexToBytes(testIdentity.privateKey)
  assertBytes(privateKey, 32)
  const signer = makePrivateKeySigner(privateKey)
  const payload = new Uint8Array([1, 2, 3])
  const socHash = '9d453ebb73b2fedaaf44ceddcf7a0aa37f3e3d6453fea5841c31f0ea6d61dc85' as HexString
  const identifier = new Uint8Array(32) as Bytes<32>

  it('upload single owner chunk', async function () {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const socAddress = bytesToHex(soc.address())

    const response = await uploadSingleOwnerChunk(beeKyOptions(), soc, getPostageBatch())

    expect(response).to.eql(socAddress)
  })

  it('download single owner chunk', async function () {
    const data = await chunkAPI.download(beeKyOptions(), socHash)
    const address = hexToBytes(socHash)
    assertBytes(address, 32)
    const soc = makeSingleOwnerChunkFromData(data, address)
    const socAddress = soc.address()

    expect(socAddress).to.eql(address)
  })
})
