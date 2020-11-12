import * as File from '../../src/modules/file'
import * as Tag from '../../src/modules/tag'
import chai from 'chai'
import { createReadable, randomBuffer, sleep } from '../utils'

const { expect } = chai

const BEE_URL = process.env.BEE_URL || 'http://bee-0.localhost'

describe('modules/file', () => {
  it('should store and retrieve file', async () => {
    const file = 'hello world'
    const hash = await File.upload(`${BEE_URL}/files`, file)

    const res = await File.download(`${BEE_URL}/files`, hash)

    expect(res.toString()).to.equal(file)
    expect(hash).to.equal('c410e2d6802bbabc22b4081a00b29456f14e94d4da13d0af4dbd42b416902479')
  })

  it('should store readable file', async () => {
    const file = randomBuffer(5000).toString('hex')
    const hash = await File.upload(`${BEE_URL}/files`, createReadable(file), {
      size: file.length
    })

    const result = await File.download(`${BEE_URL}/files`, hash)

    expect(result.toString()).to.equal(file)
  })

  // TODO: figure out how to retrieve the filename
  xit('should store file with filename', async () => {
    const file = randomBuffer(5000)
    const hash = await File.upload(`${BEE_URL}/files`, file, {
      name: 'file.txt'
    })

    const res = await File.download(`${BEE_URL}/files`, hash)

    expect(res.toString('hex')).to.equal(file.toString('hex'))
  })

  it('should store file with a tag', async () => {
    const file = randomBuffer(5000)
    const tag = await Tag.createTag(`${BEE_URL}/tags`)
    await File.upload(`${BEE_URL}/files`, file, { tag: tag.uid })

    await sleep(2000)
    const tag2 = await Tag.retrieveTag(`${BEE_URL}/tags`, tag)

    expect(tag2.split).to.equal(5)
    expect(tag2.stored).to.equal(5)
  }).timeout(5000)
})
