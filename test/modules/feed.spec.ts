import { createFeedManifest, findFeedUpdate } from '../../src/modules/feed'
import { HexString, stripHexPrefix } from '../../src/utils/hex'
import { beeUrl, testIdentity } from '../utils'

describe('modules/feed', () => {
  const url = beeUrl()
  const owner = stripHexPrefix(testIdentity.address)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString

  test('feed manifest creation', async () => {
    const reference = '92442c3e08a308aeba8e2d231733ec57011a203354cad24129e7e0c37bac0cbe'
    const response = await createFeedManifest(url, owner, topic)

    expect(response).toEqual({ reference })
  })

  test('empty feed update', async () => {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000'
    const feedUpdate = findFeedUpdate(url, owner, emptyTopic)

    await expect(feedUpdate).rejects.toThrow('Not Found')
  }, 15000)
})
