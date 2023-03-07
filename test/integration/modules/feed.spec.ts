import { expect } from 'chai'
import { createFeedManifest, fetchLatestFeedUpdate } from '../../../src/modules/feed'
import { upload as uploadSOC } from '../../../src/modules/soc'
import type { Topic } from '../../../src/types'
import { HexString, hexToBytes, makeHexString } from '../../../src/utils/hex'
import {
  beeKyOptions,
  commonMatchers,
  ERR_TIMEOUT,
  getPostageBatch,
  testIdentity,
  tryDeleteChunkFromLocalStorage,
} from '../../utils'

commonMatchers()

describe('modules/feed', () => {
  const BEE_KY_OPTIONS = beeKyOptions()
  const owner = makeHexString(testIdentity.address, 40)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as Topic

  it('feed manifest creation', async function () {
    const reference = '92442c3e08a308aeba8e2d231733ec57011a203354cad24129e7e0c37bac0cbe'
    const response = await createFeedManifest(BEE_KY_OPTIONS, owner, topic, getPostageBatch())

    expect(response).to.eql(reference)
  })

  it('empty feed update', async function () {
    this.timeout(ERR_TIMEOUT)

    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as Topic
    const feedUpdate = fetchLatestFeedUpdate(BEE_KY_OPTIONS, owner, emptyTopic)

    await expect(feedUpdate).rejectedWith('Not Found')
  })

  it('one feed update', async function () {
    this.timeout(ERR_TIMEOUT)

    const oneUpdateTopic = '2000000000000000000000000000000000000000000000000000000000000000' as Topic
    const identifier = '7c5c4c857ed4cae434c2c737bad58a93719f9b678647310ffd03a20862246a3b'
    const signature =
      'bba40ea2c87b7801f54f5cca70e06deaed5c366b588e38ce0c42f7f8f16562c3243b43101faa6dbaeaab3244b1a0ceaec92dd117995e19116a372eadbec945b01b'
    const socData = hexToBytes(
      '280000000000000000000000602a57df0000000000000000000000000000000000000000000000000000000000000000' as HexString,
    )

    // delete the chunk from local storage if already exists
    // this makes the test repeatable
    const cacAddress = '03e8eef6d72dbca9dfb7d2e15a5a305a152a3807ac7fd5ea52721a16972f3813'
    await tryDeleteChunkFromLocalStorage(cacAddress)

    const socResponse = await uploadSOC(BEE_KY_OPTIONS, owner, identifier, signature, socData, getPostageBatch())
    expect(socResponse).a('string')

    const feedUpdate = await fetchLatestFeedUpdate(BEE_KY_OPTIONS, owner, oneUpdateTopic)
    expect(feedUpdate.reference).a('string')
    expect(feedUpdate.feedIndex).to.eql('0000000000000000')
    expect(feedUpdate.feedIndexNext).to.eql('0000000000000001')
  })
})
