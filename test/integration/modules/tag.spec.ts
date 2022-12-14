import * as tag from '../../../src/modules/tag'
import { beeKyOptions, commonMatchers } from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

commonMatchers()

describe('modules/tag', () => {
  it('should list tags', async function () {
    await tag.createTag(BEE_KY_OPTIONS)
    const tags = await tag.getAllTags(BEE_KY_OPTIONS)

    expect(tags).to.equal(
      expect.arrayContaining([
        expect.objectContaining({
          total: expect.any(Number),
          processed: expect.any(Number),
          synced: expect.any(Number),
          uid: expect.any(Number),
          startedAt: expect.any(String),
        }),
      ]),
    )
  })

  it('should create empty tag', async function () {
    const tag1 = await tag.createTag(BEE_KY_OPTIONS)

    expect(tag1.total).toBe(0)
    expect(tag1.processed).toBe(0)
    expect(tag1.synced).toBe(0)
    expect(Number.isInteger(tag1.uid)).toBeTruthy()
    expect(tag1.startedAt).toBeType('string')
  })

  it('should retrieve previously created empty tag', async function () {
    const tag1 = await tag.createTag(BEE_KY_OPTIONS)
    const tag2 = await tag.retrieveTag(BEE_KY_OPTIONS, tag1.uid)

    expect(tag1).to.equal(tag2)
    expect(tag1).to.equal(
      expect.objectContaining({
        total: expect.any(Number),
        processed: expect.any(Number),
        synced: expect.any(Number),
        uid: expect.any(Number),
        startedAt: expect.any(String),
      }),
    )
  })
})
