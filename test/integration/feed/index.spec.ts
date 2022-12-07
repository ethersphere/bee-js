import { fetchLatestFeedUpdate } from '../../../src/modules/feed'
import { hexToBytes, makeHexString } from '../../../src/utils/hex'
import { beeKyOptions, ERR_TIMEOUT, getPostageBatch, testIdentity } from '../../utils'
import { downloadFeedUpdate, findNextIndex, Index, updateFeed } from '../../../src/feed'
import { Bytes, assertBytes } from '../../../src/utils/bytes'
import { makePrivateKeySigner } from '../../../src/chunk/signer'
import { makeContentAddressedChunk } from '../../../src/chunk/cac'
import * as chunkAPI from '../../../src/modules/chunk'
import type { BytesReference, PrivateKeyBytes, Signer, Topic } from '../../../src/types'
import { BeeResponseError } from '../../../src'
import type { Options as KyOptions } from 'ky'

function makeChunk(index: number) {
  return makeContentAddressedChunk(new Uint8Array([index]))
}

async function uploadChunk(kyOptions: KyOptions, index: number): Promise<BytesReference> {
  const chunk = makeChunk(index)
  const reference = await chunkAPI.upload(kyOptions, chunk.data, getPostageBatch())

  return hexToBytes(reference) as BytesReference
}

// FIXME helper function for setting up test state for testing finding feed updates
// it is not intended as a replacement in tests for `uploadFeedUpdate`
// https://github.com/ethersphere/bee-js/issues/154
async function tryUploadFeedUpdate(
  kyOptions: KyOptions,
  signer: Signer,
  topic: Topic,
  index: Index,
  reference: BytesReference,
) {
  try {
    await updateFeed(kyOptions, signer, topic, reference, getPostageBatch(), undefined, index)
  } catch (e) {
    if (e instanceof BeeResponseError && e.status === 409) {
      // ignore conflict errors when uploading the same feed update twice
      return
    }
    throw e
  }
}

describe('feed', () => {
  const BEE_KY_OPTIONS = beeKyOptions()
  const owner = makeHexString(testIdentity.address, 40)
  const signer = makePrivateKeySigner(hexToBytes(testIdentity.privateKey) as PrivateKeyBytes)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as Topic

  test(
    'empty feed update',
    async () => {
      const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as Topic
      const index = await findNextIndex(BEE_KY_OPTIONS, owner, emptyTopic)

      expect(index).toEqual('0000000000000000')
    },
    ERR_TIMEOUT,
  )

  test('feed update', async () => {
    const uploadedChunk = await uploadChunk(BEE_KY_OPTIONS, 0)
    await tryUploadFeedUpdate(BEE_KY_OPTIONS, signer, topic, 0, uploadedChunk)

    const feedUpdate = await fetchLatestFeedUpdate(BEE_KY_OPTIONS, owner, topic)

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
      await tryUploadFeedUpdate(BEE_KY_OPTIONS, signer, multipleUpdateTopic, i, referenceI)
    }

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      const feedUpdateResponse = await downloadFeedUpdate(BEE_KY_OPTIONS, signer.address, multipleUpdateTopic, i)
      expect(feedUpdateResponse.reference).toEqual(referenceI)
    }
  }, 15000)
})
