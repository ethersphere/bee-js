import { fetchFeedUpdate } from '../../../src/modules/feed'
import { hexToBytes, makeHexString } from '../../../src/utils/hex'
import { beeKy, ERR_TIMEOUT, getPostageBatch, testIdentity } from '../../utils'
import { ChunkReference, downloadFeedUpdate, findNextIndex, Index, uploadFeedUpdate } from '../../../src/feed'
import { Bytes, assertBytes } from '../../../src/utils/bytes'
import { makePrivateKeySigner } from '../../../src/chunk/signer'
import { makeContentAddressedChunk } from '../../../src/chunk/cac'
import * as chunkAPI from '../../../src/modules/chunk'
import type { Ky, PrivateKeyBytes, Signer, Topic } from '../../../src/types'
import { BeeResponseError } from '../../../src'

function makeChunk(index: number) {
  return makeContentAddressedChunk(new Uint8Array([index]))
}

async function uploadChunk(ky: Ky, index: number): Promise<ChunkReference> {
  const chunk = makeChunk(index)
  const reference = await chunkAPI.upload(ky, chunk.data, getPostageBatch())

  return hexToBytes(reference) as ChunkReference
}

// FIXME helper function for setting up test state for testing finding feed updates
// it is not intended as a replacement in tests for `uploadFeedUpdate`
// https://github.com/ethersphere/bee-js/issues/154
async function tryUploadFeedUpdate(ky: Ky, signer: Signer, topic: Topic, index: Index, reference: ChunkReference) {
  try {
    await uploadFeedUpdate(ky, signer, topic, index, reference, getPostageBatch())
  } catch (e) {
    if (e instanceof BeeResponseError && e.status === 409) {
      // ignore conflict errors when uploading the same feed update twice
      return
    }
    throw e
  }
}

describe('feed', () => {
  const BEE_KY = beeKy()
  const owner = makeHexString(testIdentity.address, 40)
  const signer = makePrivateKeySigner(hexToBytes(testIdentity.privateKey) as PrivateKeyBytes)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as Topic

  test(
    'empty feed update',
    async () => {
      const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as Topic
      const index = await findNextIndex(BEE_KY, owner, emptyTopic)

      expect(index).toEqual('0000000000000000')
    },
    ERR_TIMEOUT,
  )

  test('feed update', async () => {
    const uploadedChunk = await uploadChunk(BEE_KY, 0)
    await tryUploadFeedUpdate(BEE_KY, signer, topic, 0, uploadedChunk)

    const feedUpdate = await fetchFeedUpdate(BEE_KY, owner, topic)

    expect(feedUpdate.feedIndex).toEqual('0000000000000000')
    expect(feedUpdate.feedIndexNext).toEqual('0000000000000001')
  }, 21000)

  test('multiple updates and lookup', async () => {
    const reference = makeHexString('0000000000000000000000000000000000000000000000000000000000000000', 64)
    const referenceBytes = hexToBytes(reference)
    assertBytes(referenceBytes, 32)
    const multipleUpdateTopic = '3000000000000000000000000000000000000000000000000000000000000000' as Topic

    const numUpdates = 5

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      await tryUploadFeedUpdate(BEE_KY, signer, multipleUpdateTopic, i, referenceI)
    }

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      const feedUpdateResponse = await downloadFeedUpdate(BEE_KY, signer.address, multipleUpdateTopic, i)
      expect(feedUpdateResponse.reference).toEqual(referenceI)
    }
  }, 15000)
})
