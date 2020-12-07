import * as File from '../../src/modules/file'
import * as Tag from '../../src/modules/tag'
import { beeUrl, createReadable, randomBuffer } from '../utils'

const BEE_URL = beeUrl()

describe('modules/file', () => {
  it('should store and retrieve file', async () => {
    const data = 'hello world'
    const filename = 'hello.txt'

    const hash = await File.upload(BEE_URL, data, filename)
    const file = await File.download(BEE_URL, hash)

    expect(Buffer.from(file.data).toString()).toEqual(data)
    expect(file.name).toEqual(filename)
  })

  it('should store file without filename', async () => {
    const data = 'hello world'

    const hash = await File.upload(BEE_URL, data)
    const file = await File.download(BEE_URL, hash)

    expect(Buffer.from(file.data).toString()).toEqual(data)
  })

  it('should store readable file', async () => {
    const data = randomBuffer(5000)
    const filename = 'hello.txt'

    const hash = await File.upload(BEE_URL, createReadable(data), filename, {
      size: data.length,
    })
    const file = await File.download(BEE_URL, hash)

    expect(file.data).toEqual(data)
  })

  it('should store file with a tag', async () => {
    const data = randomBuffer(5000)
    const filename = 'hello.txt'

    const tag = await Tag.createTag(BEE_URL)
    await File.upload(BEE_URL, data, filename, { tag: tag.uid })
    const tag2 = await Tag.retrieveTag(BEE_URL, tag)

    expect(tag2.split).toEqual(5)
    expect(tag2.stored).toEqual(5)
  }, 5000)

  it('should catch error', async () => {
    const invalidReference = '0000000000000000000000000000000000000000000000000000000000000000'

    await expect(File.download(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
  })
})
