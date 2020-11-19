import * as Tag from '../../src/modules/tag'
import chai from 'chai'

const { expect } = chai

const BEE_URL = process.env.BEE_URL || 'http://bee-0.localhost'

describe('modules/tag', () => {
  it('should create empty tag', async () => {
    const tag = await Tag.createTag(`${BEE_URL}/tags`)

    expect(tag.total).to.equal(0)
    expect(tag.split).to.equal(0)
    expect(tag.seen).to.equal(0)
    expect(tag.stored).to.equal(0)
    expect(tag.sent).to.equal(0)
    expect(tag.synced).to.equal(0)
    expect(tag.uid).to.satisfy(Number.isInteger)
    expect(tag.name).to.be.a('string')
    expect(tag.address).to.equal('')
    expect(tag.startedAt).to.be.a('string')
  })

  it('should retrieve previously created empty tag', async () => {
    const tag = await Tag.createTag(`${BEE_URL}/tags`)
    const tag2 = await Tag.retrieveTag(`${BEE_URL}/tags`, tag)

    expect(tag).to.deep.include(tag2)
  })
})
