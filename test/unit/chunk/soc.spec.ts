import { Bytes, assertBytes } from '../../../src/utils/bytes'
import { makeSingleOwnerChunk } from '../../../src/chunk/soc'
import { makeContentAddressedChunk } from '../../../src/chunk/cac'
import { testIdentity } from '../../utils'
import { makePrivateKeySigner } from '../../../src/chunk/signer'
import { HexString, hexToBytes, bytesToHex } from '../../../src/utils/hex'

describe('soc', () => {
  const privateKey = hexToBytes(testIdentity.privateKey)
  assertBytes(privateKey, 32)
  const signer = makePrivateKeySigner(privateKey)
  const payload = new Uint8Array([1, 2, 3])
  const socHash = '9d453ebb73b2fedaaf44ceddcf7a0aa37f3e3d6453fea5841c31f0ea6d61dc85' as HexString
  const identifier = new Uint8Array(32) as Bytes<32>

  test('single owner chunk creation', async () => {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const socAddress = bytesToHex(soc.address())
    const owner = soc.owner()

    expect(socAddress).toEqual(socHash)
    expect(owner).toEqual(signer.address)
  })
})
