import * as tag from '../../../src/modules/tag'
import { beeKyOptions, commonMatchers } from '../../utils'

const BEE_REQUEST_OPTIONS = beeKyOptions()

commonMatchers()

describe('modules/tag', () => {
  it('should list tags', async function () {
    await tag.createTag(BEE_REQUEST_OPTIONS)
    const tags = await tag.getAllTags(BEE_REQUEST_OPTIONS)

    expect(tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          address: expect.any(String),
          seen: expect.any(Number),
          sent: expect.any(Number),
          split: expect.any(Number),
          startedAt: expect.any(String),
          stored: expect.any(Number),
          synced: expect.any(Number),
          uid: expect.any(Number),
        }),
      ]),
    )
  })

  it('should create empty tag', async function () {
    const tag1 = await tag.createTag(BEE_REQUEST_OPTIONS)

    expect(tag1.split).toBe(0)
    expect(tag1.sent).toBe(0)
    expect(tag1.synced).toBe(0)
    expect(tag1.stored).toBe(0)
    expect(Number.isInteger(tag1.uid)).toBeTruthy()
    expect(tag1.startedAt).toBeType('string')
  })

  it('should retrieve previously created empty tag', async function () {
    const tag1 = await tag.createTag(BEE_REQUEST_OPTIONS)
    const tag2 = await tag.retrieveTag(BEE_REQUEST_OPTIONS, tag1.uid)

    expect(tag1).toStrictEqual(tag2)
    expect(tag1).toEqual(
      expect.objectContaining({
        address: expect.any(String),
        seen: expect.any(Number),
        sent: expect.any(Number),
        split: expect.any(Number),
        startedAt: expect.any(String),
        stored: expect.any(Number),
        synced: expect.any(Number),
        uid: expect.any(Number),
      }),
    )
  })
})
