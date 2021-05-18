import * as bzz from '../../../src/modules/bzz'
import { Collection, ENCRYPTED_REFERENCE_HEX_LENGTH } from '../../../src/types'
import {
  beeUrl,
  BIG_FILE_TIMEOUT,
  createReadable,
  ERR_TIMEOUT,
  getPostageBatch,
  invalidReference,
  randomByteArray,
} from '../../utils'
import { makeCollectionFromFS } from '../../../src/utils/collection'
import * as tag from '../../../src/modules/tag'

const BEE_URL = beeUrl()

describe('modules/bzz', () => {
  beforeAll(async () => {
    // This will create the default batch if it is was not created before
    await getPostageBatch()
  }, 60000)

  describe('collections', () => {
    it('should store and retrieve collection with single file', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch())
      const file = await bzz.downloadFile(BEE_URL, hash, directoryStructure[0].path)

      expect(file.name).toEqual(directoryStructure[0].path)
      expect(file.data).toEqual(directoryStructure[0].data)
    })

    it('should retrieve the filename but not the complete path', async () => {
      const path = 'a/b/c/d/'
      const name = '0'
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: `${path}${name}`,
          data: Uint8Array.from([0]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch())
      const file = await bzz.downloadFile(BEE_URL, hash, directoryStructure[0].path)

      expect(file.name).toEqual(name)
      expect(file.data).toEqual(directoryStructure[0].data)
    })

    it('should work with pinning', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch(), { pin: true })
      const file = await bzz.downloadFile(BEE_URL, hash, directoryStructure[0].path)

      expect(file.name).toEqual(directoryStructure[0].path)
      expect(file.data).toEqual(directoryStructure[0].data)
    })

    it('should work with encryption', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch(), { encrypt: true })
      const file = await bzz.downloadFile(BEE_URL, hash, directoryStructure[0].path)

      expect(file.name).toEqual(directoryStructure[0].path)
      expect(file.data).toEqual(directoryStructure[0].data)
      expect(hash.length).toEqual(ENCRYPTED_REFERENCE_HEX_LENGTH)
    })

    it(
      'should upload bigger file',
      async () => {
        const directoryStructure: Collection<Uint8Array> = [
          {
            path: '0',
            data: new Uint8Array(32 * 1024 * 1024),
          },
        ]

        const response = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch())

        expect(typeof response).toEqual('string')
      },
      BIG_FILE_TIMEOUT,
    )

    it('should throw error when the upload url is not set', async () => {
      await expect(
        bzz.uploadCollection((undefined as unknown) as string, (undefined as unknown) as [], await getPostageBatch()),
      ).rejects.toThrowError()
    })

    it('should throw error when the upload url is not empty', async () => {
      const url = ''
      await expect(
        bzz.uploadCollection(url, (undefined as unknown) as [], await getPostageBatch()),
      ).rejects.toThrowError()
    })

    it('should throw error when the collection is empty', async () => {
      await expect(bzz.uploadCollection(BEE_URL, [], await getPostageBatch())).rejects.toThrowError()
    })

    it('should store and retrieve collection', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
        {
          path: '1',
          data: Uint8Array.from([1]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch())

      const file0 = await bzz.downloadFile(BEE_URL, hash, directoryStructure[0].path)
      expect(file0.name).toEqual(directoryStructure[0].path)
      expect(file0.data).toEqual(directoryStructure[0].data)

      const file1 = await bzz.downloadFile(BEE_URL, hash, directoryStructure[1].path)
      expect(file1.name).toEqual(directoryStructure[1].path)
      expect(file1.data).toEqual(directoryStructure[1].data)
    })

    it('should store and retrieve collection with index document', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
        {
          path: '1',
          data: Uint8Array.from([1]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch(), {
        indexDocument: '0',
      })

      const indexFile = await bzz.downloadFile(BEE_URL, hash)
      expect(indexFile.name).toEqual(directoryStructure[0].path)
      expect(indexFile.data).toEqual(directoryStructure[0].data)
    })

    it('should store and retrieve collection with error document', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
        {
          path: '1',
          data: Uint8Array.from([1]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch(), {
        errorDocument: '0',
      })

      const errorFile = await bzz.downloadFile(BEE_URL, hash, 'error')
      expect(errorFile.name).toEqual(directoryStructure[0].path)
      expect(errorFile.data).toEqual(directoryStructure[0].data)
    })

    it('should store and retrieve actual directory', async () => {
      const path = 'test/data/'
      const dir = `./${path}`
      const file3Name = '3.txt'
      const subDir = 'sub/'
      const data = Uint8Array.from([51, 10])
      const directoryStructure = await makeCollectionFromFS(dir)
      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch())

      const file3 = await bzz.downloadFile(BEE_URL, hash, `${subDir}${file3Name}`)
      expect(file3.name).toEqual(file3Name)
      expect(file3.data).toEqual(data)
    })

    it('should store and retrieve actual directory with index document', async () => {
      const path = 'test/data/'
      const dir = `./${path}`
      const fileName = '1.txt'
      const data = Uint8Array.from([49, 10])
      const directoryStructure = await makeCollectionFromFS(dir)
      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, await getPostageBatch(), {
        indexDocument: `${fileName}`,
      })

      const file1 = await bzz.downloadFile(BEE_URL, hash)
      expect(file1.name).toEqual(fileName)
      expect(file1.data).toEqual(data)
    })
  })

  describe('file', () => {
    it('should store and retrieve file', async () => {
      const data = 'hello world'
      const filename = 'hello.txt'

      const hash = await bzz.uploadFile(BEE_URL, data, await getPostageBatch(), filename)
      const fileData = await bzz.downloadFile(BEE_URL, hash)

      expect(Buffer.from(fileData.data).toString()).toEqual(data)
      expect(fileData.name).toEqual(filename)
    })

    it('should store file without filename', async () => {
      const data = 'hello world'

      const hash = await bzz.uploadFile(BEE_URL, data, await getPostageBatch())
      const fileData = await bzz.downloadFile(BEE_URL, hash)

      expect(Buffer.from(fileData.data).toString()).toEqual(data)
    })

    it('should store readable file', async () => {
      const data = randomByteArray(5000, 0)
      const filename = 'hello.txt'

      const hash = await bzz.uploadFile(BEE_URL, createReadable(data), await getPostageBatch(), filename, {
        size: data.length,
      })
      const fileData = await bzz.downloadFile(BEE_URL, hash)

      expect(fileData.data).toEqual(data)
    })

    it('should store file with a tag', async () => {
      // Relates to how many chunks is uploaded which depends on manifest serialization.
      // https://github.com/ethersphere/bee/pull/1501#discussion_r611385602
      const EXPECTED_TAGS_COUNT = 6

      const data = randomByteArray(5000, 1)
      const filename = 'hello.txt'

      const tag1 = await tag.createTag(BEE_URL)
      await bzz.uploadFile(BEE_URL, data, await getPostageBatch(), filename, { tag: tag1.uid })
      const tag2 = await tag.retrieveTag(BEE_URL, tag1)

      expect(tag2.total).toEqual(EXPECTED_TAGS_COUNT)
      expect(tag2.processed).toEqual(EXPECTED_TAGS_COUNT)
    }, 5000)

    it(
      'should catch error',
      async () => {
        await expect(bzz.downloadFile(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
      },
      BIG_FILE_TIMEOUT,
    )

    it(
      'should upload bigger file',
      async () => {
        const data = new Uint8Array(32 * 1024 * 1024)
        const response = await bzz.uploadFile(BEE_URL, data, await getPostageBatch())

        expect(typeof response).toEqual('string')
      },
      BIG_FILE_TIMEOUT,
    )
  })
})
