import { fetchFeedUpdate } from '../../src/modules/feed'
import { HexString, hexToBytes, stripHexPrefix, assertHexString } from '../../src/utils/hex'
import { beeUrl, testIdentity } from '../utils'
import { ChunkReference, downloadFeedUpdate, findNextIndex, Index, uploadFeedUpdate } from '../../src/feed'
import { Bytes, verifyBytes } from '../../src/utils/bytes'
import { makeDefaultSigner, PrivateKey, Signer } from '../../src/chunk/signer'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import * as chunkAPI from '../../src/modules/chunk'
import { Topic } from '../../src/feed/topic'
import { BeeResponseError } from '../../src'

function makeChunk(index: number) {
  return makeContentAddressedChunk(new Uint8Array([index]))
}

async function uploadChunk(url: string, index: number): Promise<ChunkReference> {
  const chunk = makeChunk(index)
  const referenceResponse = await chunkAPI.upload(url, chunk.data)

  return hexToBytes(referenceResponse.reference as HexString) as ChunkReference
}

// FIXME helper function for setting up test state for testing finding feed updates
// it is not intended as a replacement in tests for `uploadFeedUpdate`
// https://github.com/ethersphere/bee-js/issues/154
async function tryUploadFeedUpdate(url: string, signer: Signer, topic: Topic, index: Index, reference: ChunkReference) {
  try {
    await uploadFeedUpdate(url, signer, topic, index, reference)
  } catch (e) {
    if (e instanceof BeeResponseError && e.status === 409) {
      // ignore conflict errors when uploading the same feed update twice
      return
    }
    throw e
  }
}

describe('feed', () => {
  const url = beeUrl()
  const owner = stripHexPrefix(testIdentity.address)
  const signer = makeDefaultSigner(hexToBytes(testIdentity.privateKey) as PrivateKey)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString

  test('empty feed update', async () => {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as HexString
    const index = await findNextIndex(url, owner, emptyTopic)

    expect(index).toEqual('0000000000000000')
  }, 15000)

  test('feed update', async () => {
    const topicBytes = hexToBytes(topic) as Bytes<32>

    const uploadedChunk = await uploadChunk(url, 0)
    await tryUploadFeedUpdate(url, signer, topicBytes, 0, uploadedChunk)

    const feedUpdate = await fetchFeedUpdate(url, owner, topic)

    expect(feedUpdate.feedIndex).toEqual('0000000000000000')
    expect(feedUpdate.feedIndexNext).toEqual('0000000000000001')
  }, 15000)

  test('multiple updates and lookup', async () => {
    const reference = '0000000000000000000000000000000000000000000000000000000000000000' as HexString
    const referenceBytes = verifyBytes(32, hexToBytes(assertHexString(reference)))
    const multipleUpdateTopic = '3000000000000000000000000000000000000000000000000000000000000000' as HexString
    const topicBytes = verifyBytes(32, hexToBytes(multipleUpdateTopic))

    const numUpdates = 5

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      await tryUploadFeedUpdate(url, signer, topicBytes, i, referenceI)
    }

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      const feedUpdateResponse = await downloadFeedUpdate(url, signer.address, topicBytes, i)
      expect(feedUpdateResponse.reference).toEqual(referenceI)
    }
  }, 15000)
})
