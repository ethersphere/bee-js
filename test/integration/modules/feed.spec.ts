import { createFeedManifest, fetchLatestFeedUpdate } from '../../../src/modules/feed'
import { upload as uploadSOC } from '../../../src/modules/soc'
import type { Topic } from '../../../src/types'
import { NULL_TOPIC } from '../../../src/utils/expose'
import { HexString, hexToBytes, makeHexString } from '../../../src/utils/hex'
import { beeKyOptions, commonMatchers, getPostageBatch, testIdentity } from '../../utils'

commonMatchers()

describe('modules/feed', () => {
  const BEE_REQUEST_OPTIONS = beeKyOptions()
  const owner = makeHexString(testIdentity.address, 40)
  const topic = NULL_TOPIC

  it('feed manifest creation', async function () {
    const reference = '92442c3e08a308aeba8e2d231733ec57011a203354cad24129e7e0c37bac0cbe'
    const response = await createFeedManifest(BEE_REQUEST_OPTIONS, owner, topic, getPostageBatch())

    expect(response).toBe(reference)
  })

  it('empty feed update', async function () {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000' as Topic
    const feedUpdate = fetchLatestFeedUpdate(BEE_REQUEST_OPTIONS, owner, emptyTopic)

    await expect(feedUpdate).rejects.toThrow('Request failed with status code 404')
  })

  it('one feed update', async function () {
    const oneUpdateTopic = '2000000000000000000000000000000000000000000000000000000000000000' as Topic
    const identifier = '7c5c4c857ed4cae434c2c737bad58a93719f9b678647310ffd03a20862246a3b'
    const signature =
      'bba40ea2c87b7801f54f5cca70e06deaed5c366b588e38ce0c42f7f8f16562c3243b43101faa6dbaeaab3244b1a0ceaec92dd117995e19116a372eadbec945b01b'
    const socData = hexToBytes(
      '280000000000000000000000602a57df0000000000000000000000000000000000000000000000000000000000000000' as HexString,
    )

    const socResponse = await uploadSOC(BEE_REQUEST_OPTIONS, owner, identifier, signature, socData, getPostageBatch())
    expect(socResponse.reference).toBeType('string')

    const feedUpdate = await fetchLatestFeedUpdate(BEE_REQUEST_OPTIONS, owner, oneUpdateTopic)
    expect(feedUpdate.reference).toBeType('string')
    expect(feedUpdate.feedIndex).toBe('0000000000000000')
    expect(feedUpdate.feedIndexNext).toBe('0000000000000001')
  })
})
