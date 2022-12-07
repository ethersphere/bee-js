import * as beeTag from '../../../../src/modules/tag'
import * as beeDebugTag from '../../../../src/modules/debug/tag'
import { beeDebugKyOptions, beeKyOptions } from '../../../utils'

const BEE_URL = beeKyOptions()
const BEE_DEBUG_KY = beeDebugKyOptions()

describe('modules/tag', () => {
  it('should retrieve extended tag', async () => {
    const tag1 = await beeTag.createTag(BEE_URL)
    const tag2 = await beeDebugTag.retrieveExtendedTag(BEE_DEBUG_KY, tag1.uid)

    expect(tag2).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        split: expect.any(Number),
        seen: expect.any(Number),
        stored: expect.any(Number),
        sent: expect.any(Number),
        synced: expect.any(Number),
        uid: expect.any(Number),
        startedAt: expect.any(String),
        address: expect.any(String),
      }),
    )
  })
})
