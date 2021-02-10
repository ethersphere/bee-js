import { findFeedUpdate } from '../../src/modules/feed'
import { HexString, hexToBytes, stripHexPrefix, verifyHex } from '../../src/utils/hex'
import { beeUrl, testIdentity } from '../utils'
import { ChunkReference, downloadFeedUpdate, findNexIndex, uploadFeedUpdate } from '../../src/feed'
import { Bytes, verifyBytes } from '../../src/utils/bytes'
import { makeDefaultSigner, PrivateKey } from '../../src/chunk/signer'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import * as chunkAPI from '../../src/modules/chunk'

function makeChunk(index: number) {
  return makeContentAddressedChunk(new Uint8Array([index]))
}

async function uploadChunk(url: string, index: number): Promise<ChunkReference> {
  const chunk = makeChunk(index)
  const referenceResponse = await chunkAPI.upload(url, chunk.data)

  return hexToBytes(referenceResponse.reference as HexString) as ChunkReference
}

describe('feed', () => {
  const url = beeUrl()
  const owner = stripHexPrefix(testIdentity.address)
  const signer = makeDefaultSigner(hexToBytes(testIdentity.privateKey) as PrivateKey)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString

  test('empty feed update', async () => {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as HexString
    const index = await findNexIndex(url, owner, emptyTopic)

    expect(index).toEqual('0000000000000000')
  }, 15000)

  test('feed update', async () => {
    const topicBytes = hexToBytes(topic) as Bytes<32>

    const uploadedChunk = await uploadChunk(url, 0)
    await uploadFeedUpdate(url, signer, topicBytes, 0, uploadedChunk)

    const feedUpdate = await findFeedUpdate(url, owner, topic)

    expect(feedUpdate.feedIndex).toEqual('0000000000000000')
    expect(feedUpdate.feedIndexNext).toEqual('0000000000000001')
  }, 15000)

  test('multiple updates and lookup', async () => {
    const reference = '0000000000000000000000000000000000000000000000000000000000000000' as HexString
    const referenceBytes = verifyBytes(32, hexToBytes(verifyHex(reference)))
    const multipleUpdateTopic = '3000000000000000000000000000000000000000000000000000000000000000' as HexString
    const topicBytes = verifyBytes(32, hexToBytes(multipleUpdateTopic))

    const numUpdates = 5

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      await uploadFeedUpdate(url, signer, topicBytes, i, referenceI)
    }

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      const feedUpdateResponse = await downloadFeedUpdate(url, signer.address, topicBytes, i)
      expect(feedUpdateResponse.reference).toEqual(referenceI)
    }
  }, 15000)
})
