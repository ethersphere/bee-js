import { expect } from 'chai'
import { makeContentAddressedChunk } from '../../../src/chunk/cac'
import { makePrivateKeySigner } from '../../../src/chunk/signer'
import { downloadFeedUpdate, FeedUploadOptions, findNextIndex, updateFeed } from '../../../src/feed'
import * as chunkAPI from '../../../src/modules/chunk'
import { fetchLatestFeedUpdate } from '../../../src/modules/feed'
import type { BeeRequestOptions, BytesReference, PrivateKeyBytes, Signer, Topic } from '../../../src/types'
import { assertBytes, Bytes } from '../../../src/utils/bytes'
import { hexToBytes, makeHexString } from '../../../src/utils/hex'
import { beeKyOptions, ERR_TIMEOUT, getPostageBatch, testIdentity } from '../../utils'

function makeChunk(index: number) {
  return makeContentAddressedChunk(new Uint8Array([index]))
}

async function uploadChunk(options: BeeRequestOptions, index: number): Promise<BytesReference> {
  const chunk = makeChunk(index)
  const reference = await chunkAPI.upload(options, chunk.data, getPostageBatch())

  return hexToBytes(reference) as BytesReference
}

// FIXME helper function for setting up test state for testing finding feed updates
// it is not intended as a replacement in tests for `uploadFeedUpdate`
// https://github.com/ethersphere/bee-js/issues/154
async function tryUploadFeedUpdate(
  options: BeeRequestOptions,
  signer: Signer,
  topic: Topic,
  reference: BytesReference,
  feedOptions?: FeedUploadOptions,
) {
  try {
    await updateFeed(options, signer, topic, reference, getPostageBatch(), feedOptions)
  } catch (e: any) {
    if (e?.response?.status === 409) {
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

  it('empty feed update', async function () {
    this.timeout(ERR_TIMEOUT)
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as Topic
    const index = await findNextIndex(BEE_KY_OPTIONS, owner, emptyTopic)

    expect(index).to.eql('0000000000000000')
  })

  it('feed update', async function () {
    this.timeout(21000)

    const uploadedChunk = await uploadChunk(BEE_KY_OPTIONS, 0)
    await tryUploadFeedUpdate(BEE_KY_OPTIONS, signer, topic, uploadedChunk, { index: 0 })

    const feedUpdate = await fetchLatestFeedUpdate(BEE_KY_OPTIONS, owner, topic)

    expect(feedUpdate.feedIndex).to.eql('0000000000000000')
    expect(feedUpdate.feedIndexNext).to.eql('0000000000000001')
  })

  it('multiple updates and lookup', async function () {
    this.timeout(15000)

    const reference = makeHexString('0000000000000000000000000000000000000000000000000000000000000000', 64)
    const referenceBytes = hexToBytes(reference)
    assertBytes(referenceBytes, 32)
    const multipleUpdateTopic = '3000000000000000000000000000000000000000000000000000000000000000' as Topic

    const numUpdates = 5

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      await tryUploadFeedUpdate(BEE_KY_OPTIONS, signer, multipleUpdateTopic, referenceI, { index: i })
    }

    for (let i = 0; i < numUpdates; i++) {
      const referenceI = new Uint8Array([i, ...referenceBytes.slice(1)]) as Bytes<32>
      const feedUpdateResponse = await downloadFeedUpdate(BEE_KY_OPTIONS, signer.address, multipleUpdateTopic, i)
      expect(feedUpdateResponse.reference).to.eql(referenceI)
    }
  })
})
