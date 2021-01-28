import * as file from '../../src/modules/file'
import * as tag from '../../src/modules/tag'
import { beeUrl, createReadable, invalidReference, randomByteArray } from '../utils'

const BEE_URL = beeUrl()

describe('modules/file', () => {
  it('should store and retrieve file', async () => {
    const data = 'hello world'
    const filename = 'hello.txt'

    const hash = await file.upload(BEE_URL, data, filename)
    const fileData = await file.download(BEE_URL, hash)

    expect(Buffer.from(fileData.data).toString()).toEqual(data)
    expect(fileData.name).toEqual(filename)
  })

  it('should store file without filename', async () => {
    const data = 'hello world'

    const hash = await file.upload(BEE_URL, data)
    const fileData = await file.download(BEE_URL, hash)

    expect(Buffer.from(fileData.data).toString()).toEqual(data)
  })

  it('should store readable file', async () => {
    const data = randomByteArray(5000)
    const filename = 'hello.txt'

    const hash = await file.upload(BEE_URL, createReadable(data), filename, {
      size: data.length,
    })
    const fileData = await file.download(BEE_URL, hash)

    expect(fileData.data).toEqual(data)
  })

  it('should store file with a tag', async () => {
    const data = randomByteArray(5000)
    const filename = 'hello.txt'

    const tag1 = await tag.createTag(BEE_URL)
    await file.upload(BEE_URL, data, filename, { tag: tag1.uid })
    const tag2 = await tag.retrieveTag(BEE_URL, tag1)

    expect(tag2.split).toEqual(5)
    expect(tag2.stored).toEqual(5)
  }, 5000)

  it('should catch error', async () => {
    await expect(file.download(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
  })

  it('should upload bigger file', async () => {
    const data = new Uint8Array(32 * 1024 * 1024)
    const response = await file.upload(BEE_URL, data)

    expect(typeof response).toEqual('string')
  }, 20000)
})
