import * as tag from '../../src/modules/tag'
import { beeUrl } from '../utils'

const BEE_URL = beeUrl()

describe('modules/tag', () => {
  it('should create empty tag', async () => {
    const tag1 = await tag.createTag(BEE_URL)

    expect(tag1.total).toBe(0)
    expect(tag1.split).toBe(0)
    expect(tag1.seen).toBe(0)
    expect(tag1.stored).toBe(0)
    expect(tag1.sent).toBe(0)
    expect(tag1.synced).toBe(0)
    expect(Number.isInteger(tag1.uid)).toBeTruthy()
    expect(typeof tag1.name).toBe('string')
    expect(tag1.address).toBe('')
    expect(typeof tag1.startedAt).toBe('string')
  })

  it('should retrieve previously created empty tag', async () => {
    const tag1 = await tag.createTag(BEE_URL)
    const tag2 = await tag.retrieveTag(BEE_URL, tag1)

    expect(tag1).toEqual(tag2)
  })
})
