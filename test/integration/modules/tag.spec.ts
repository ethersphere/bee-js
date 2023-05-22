import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
import * as tag from '../../../src/modules/tag'
import { beeKyOptions, commonMatchers } from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

commonMatchers()

describe('modules/tag', () => {
  it('should list tags', async function () {
    await tag.createTag(BEE_KY_OPTIONS)
    const tags = await tag.getAllTags(BEE_KY_OPTIONS)

    jestExpect(tags).toEqual(
      jestExpect.arrayContaining([
        jestExpect.objectContaining({
          total: jestExpect.any(Number),
          processed: jestExpect.any(Number),
          synced: jestExpect.any(Number),
          uid: jestExpect.any(Number),
          startedAt: jestExpect.any(String),
        }),
      ]),
    )
  })

  it('should create empty tag', async function () {
    const tag1 = await tag.createTag(BEE_KY_OPTIONS)

    expect(tag1.total).to.eql(0)
    expect(tag1.processed).to.eql(0)
    expect(tag1.synced).to.eql(0)
    expect(Number.isInteger(tag1.uid)).to.be.ok()
    expect(tag1.startedAt).a('string')
  })

  it('should retrieve previously created empty tag', async function () {
    const tag1 = await tag.createTag(BEE_KY_OPTIONS)
    const tag2 = await tag.retrieveTag(BEE_KY_OPTIONS, tag1.uid)

    expect(tag1).to.eql(tag2)
    jestExpect(tag1).toEqual(
      jestExpect.objectContaining({
        total: jestExpect.any(Number),
        processed: jestExpect.any(Number),
        synced: jestExpect.any(Number),
        uid: jestExpect.any(Number),
        startedAt: jestExpect.any(String),
      }),
    )
  })
})
