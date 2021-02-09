import { createInitialFeed, findFeedUpdate } from '../../src/modules/feed'
import { bytesToHex, HexString, hexToBytes, stripHexPrefix, verifyHex } from '../../src/utils/hex'
import { beeUrl, testIdentity } from '../utils'
import { ChunkReference, downloadFeedUpdate, findNextIndex, uploadFeedUpdate } from '../../src/feed'
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

describe('modules/feed', () => {
  const url = beeUrl()
  const owner = stripHexPrefix(testIdentity.address)
  const signer = makeDefaultSigner(hexToBytes(testIdentity.privateKey) as PrivateKey)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString

  test('feed manifest creation', async () => {
    const reference = '92442c3e08a308aeba8e2d231733ec57011a203354cad24129e7e0c37bac0cbe'
    const response = await createInitialFeed(url, owner, topic)

    expect(response).toEqual({ reference })
  })

  test('empty feed update', async () => {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000'
    const feedUpdate = findFeedUpdate(url, owner, emptyTopic)

    await expect(feedUpdate).rejects.toThrow('Not Found')
  }, 15000)

  test('empty feed update', async () => {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as HexString
    const index = await findNextIndex(url, owner, emptyTopic)

    expect(index).toEqual(0)
  }, 15000)

  test('feed update', async () => {
    const topicBytes = hexToBytes(topic) as Bytes<32>

    const uploadedChunk = await uploadChunk(url, 0)
    await uploadFeedUpdate(url, signer, topicBytes, 0, uploadedChunk)

    const feedUpdate = await findFeedUpdate(url, owner, topic)

    expect(feedUpdate.feedIndex).toEqual(0)
    expect(feedUpdate.feedIndexNext).toEqual(1)
  })

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
  })
})
