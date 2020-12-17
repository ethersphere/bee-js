import * as pinning from '../../src/modules/pinning'
import * as file from '../../src/modules/file'
import * as collection from '../../src/modules/collection'
import * as bytes from '../../src/modules/bytes'
import { beeUrl, invalidReference, randomByteArray } from '../utils'
import { Collection } from '../../src/types'

const BEE_URL = beeUrl()

describe('modules/pin', () => {
  const okResponse = {
    code: 200,
    message: 'OK',
  }

  describe('should work with files', () => {
    const randomData = randomByteArray(5000)

    it('should pin an existing file', async () => {
      const hash = await file.upload(BEE_URL, randomData)
      const response = await pinning.pinFile(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should unpin an existing file', async () => {
      const hash = await file.upload(BEE_URL, randomData)
      const response = await pinning.unpinFile(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should not pin a non-existing file', async () => {
      await expect(pinning.pinFile(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should not unpin a non-existing file', async () => {
      await expect(pinning.unpinFile(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })
  })

  describe('should work with collections', () => {
    const testCollection: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
      {
        path: '1',
        data: Uint8Array.from([1]),
      },
    ]

    xit('should pin an existing collection', async () => {
      const hash = await collection.upload(BEE_URL, testCollection)
      // eslint-disable-next-line no-console
      console.debug({ hash })
      const response = await pinning.pinCollection(BEE_URL, hash)
      // eslint-disable-next-line no-console
      console.debug({ response })

      expect(response).toEqual(okResponse)

      // eslint-disable-next-line no-console
      console.debug('done')
    })

    xit('should unpin an existing collection', async () => {
      const hash = await collection.upload(BEE_URL, testCollection)
      const response = await pinning.unpinCollection(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should not pin a non-existing collection', async () => {
      await expect(pinning.pinCollection(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should not unpin a non-existing collection', async () => {
      await expect(pinning.unpinCollection(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })
  })

  describe('should work with data', () => {
    const randomData = randomByteArray(5000)

    it('should pin existing data', async () => {
      const hash = await bytes.upload(BEE_URL, randomData)
      const response = await pinning.pinData(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should unpin existing data', async () => {
      const hash = await bytes.upload(BEE_URL, randomData)
      const response = await pinning.unpinData(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should not pin non-existing data', async () => {
      await expect(pinning.pinData(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should not unpin non-existing data', async () => {
      await expect(pinning.unpinData(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })
  })
})
