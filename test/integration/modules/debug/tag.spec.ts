import * as beeTag from '../../../../src/modules/tag'
import * as beeDebugTag from '../../../../src/modules/debug/tag'
import { beeDebugKyOptions, beeKyOptions } from '../../../utils'
import { expect as jestExpect } from 'expect'

const BEE_URL = beeKyOptions()
const BEE_DEBUG_KY = beeDebugKyOptions()

describe('modules/tag', () => {
  it('should retrieve extended tag', async function () {
    const tag1 = await beeTag.createTag(BEE_URL)
    const tag2 = await beeDebugTag.retrieveExtendedTag(BEE_DEBUG_KY, tag1.uid)

    jestExpect(tag2).toEqual(
      jestExpect.objectContaining({
        total: jestExpect.any(Number),
        split: jestExpect.any(Number),
        seen: jestExpect.any(Number),
        stored: jestExpect.any(Number),
        sent: jestExpect.any(Number),
        synced: jestExpect.any(Number),
        uid: jestExpect.any(Number),
        startedAt: jestExpect.any(String),
        address: jestExpect.any(String),
      }),
    )
  })
})
