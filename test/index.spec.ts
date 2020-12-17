import Bee from '../src'
import { beeUrl } from './utils'

describe('Bee class', () => {
  const BEE_URL = beeUrl()
  const bee = new Bee(BEE_URL)

  describe('files', () => {
    it('should work with files', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const contentType = 'text/html'

      const hash = await bee.uploadFile(content, name, { contentType })
      const file = await bee.downloadFile(hash)

      expect(file.name).toEqual(name)
      expect(file.data).toEqual(content)
    })
  })

  describe('tags', () => {
    it('should retrieve previously created empty tag', async () => {
      const tag = await bee.createTag()
      const tag2 = await bee.retrieveTag(tag)

      expect(tag).toEqual(tag2)
    })
  })

  describe('pinning', () => {
    const okResponse = {
      code: 200,
      message: 'OK',
    }

    it('should pin and unpin files', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadFile(content)

      const pinResponse = await bee.pinFile(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinFile(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    xit('should pin and unpin collection', async () => {
      const path = './test/data/'
      const hash = await bee.uploadFilesFromDirectory(path)

      const pinResponse = await bee.pinCollection(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinCollection(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    it('should pin and unpin data', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadData(content)

      const pinResponse = await bee.pinData(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinData(hash)
      expect(unpinResponse).toEqual(okResponse)
    })
  })
})
