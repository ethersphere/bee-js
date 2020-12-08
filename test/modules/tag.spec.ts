import * as Tag from '../../src/modules/tag'
import { beeUrl } from '../utils'

const BEE_URL = beeUrl()

describe('modules/tag', () => {
  it('should create empty tag', async () => {
    const tag = await Tag.createTag(BEE_URL)

    expect(tag.total).toBe(0)
    expect(tag.split).toBe(0)
    expect(tag.seen).toBe(0)
    expect(tag.stored).toBe(0)
    expect(tag.sent).toBe(0)
    expect(tag.synced).toBe(0)
    expect(Number.isInteger(tag.uid)).toBeTruthy()
    expect(typeof tag.name).toBe('string')
    expect(tag.address).toBe('')
    expect(typeof tag.startedAt).toBe('string')
  })

  it('should retrieve previously created empty tag', async () => {
    const tag = await Tag.createTag(BEE_URL)
    const tag2 = await Tag.retrieveTag(BEE_URL, tag)

    expect(tag).toEqual(expect.objectContaining(tag2))
  })
})
