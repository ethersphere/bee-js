import Bee from '../src'
import { beeUrl } from './utils'

describe('Bee class', () => {
  const BEE_URL = beeUrl()
  const bee = new Bee(BEE_URL)

  it('should work with files', async () => {
    const content = new Uint8Array([1, 2, 3])
    const name = 'hello.txt'
    const contentType = 'text/html'

    const hash = await bee.uploadFile(content, name, { contentType })
    const file = await bee.downloadFile(hash)

    expect(file.name).toEqual(name)
    expect(file.data).toEqual(content)
  })

  it('should retrieve previously created empty tag', async () => {
    const tag = await bee.createTag()
    const tag2 = await bee.retrieveTag(tag)

    expect(tag).toEqual(tag2)
  })

  it('should pin and unping files', async () => {
    const content = new Uint8Array([1, 2, 3])

    const hash = await bee.uploadFile(content)
    await bee.pinFile(hash)
    await bee.unpinFile(hash)
  })

  it('should pin and unping collection', async () => {
    const path = './test/data/'
    const hash = await bee.uploadFilesFromDirectory(path)
    await bee.pinCollection(hash)
    await bee.unpinCollection(hash)
  })
})
