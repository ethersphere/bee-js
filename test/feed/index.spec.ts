import { fetchFeedUpdate } from '../../src/modules/feed'
import { HexString, hexToBytes, makeHexString } from '../../src/utils/hex'
import { beeUrl, ERR_TIMEOUT, testIdentity } from '../utils'
import { ChunkReference, downloadFeedUpdate, findNextIndex, Index, uploadFeedUpdate } from '../../src/feed'
import { Bytes, verifyBytes } from '../../src/utils/bytes'
import { makePrivateKeySigner, PrivateKeyBytes, Signer } from '../../src/chunk/signer'
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
  const owner = makeHexString(testIdentity.address, 40)
  const signer = makePrivateKeySigner(hexToBytes(testIdentity.privateKey) as PrivateKeyBytes)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as Topic

  test(
    'empty feed update',
    async () => {
      const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as Topic
      const index = await findNextIndex(url, owner, emptyTopic)

      expect(index).toEqual('0000000000000000')
    },
    ERR_TIMEOUT,
  )

  test('feed update', async () => {
    const uploadedChunk = await uploadChunk(url, 0)
    await tryUploadFeedUpdate(url, signer, topic, 0, uploadedChunk)

    const feedUpdate = await fetchFeedUpdate(url, owner, topic)

    expect(feedUpdate.feedIndex).toEqual('0000000000000000')
    expect(feedUpdate.feedIndexNext).toEqual('0000000000000001')
  }, 15000)

  test('multiple updates and lookup', async () => {
    const reference = makeHexString('0000000000000000000000000000000000000000000000000000000000000000', 64)
    const referenceBytes = verifyBytes(32, hexToBytes(reference))
    const multipleUpdateTopic = '3000000000000000000000000000000000000000000000000000000000000000' as Topic

    const numUpdates = 5

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      await tryUploadFeedUpdate(url, signer, multipleUpdateTopic, i, referenceI)
    }

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      const feedUpdateResponse = await downloadFeedUpdate(url, signer.address, multipleUpdateTopic, i)
      expect(feedUpdateResponse.reference).toEqual(referenceI)
    }
  }, 15000)
})
