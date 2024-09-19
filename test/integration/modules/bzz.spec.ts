import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Readable } from 'stream'
import * as bzz from '../../../src/modules/bzz'
import * as tag from '../../../src/modules/tag'
import { Collection, ENCRYPTED_REFERENCE_HEX_LENGTH } from '../../../src/types'
import { makeCollectionFromFS } from '../../../src/utils/collection.node'
import { http } from '../../../src/utils/http'
import { actBeeKyOptions, beeKyOptions, getPostageBatch, invalidReference, randomByteArray } from '../../utils'

const BEE_REQUEST_OPTIONS = beeKyOptions()

describe('modules/bzz', () => {
  describe('act', () => {
    const data = 'hello act'
    let publicKey: string

    beforeAll(async () => {
      const responsePUBK = await http<{ publicKey: string }>(BEE_REQUEST_OPTIONS, {
        method: 'get',
        url: 'addresses',
        responseType: 'json',
      })
      publicKey = responsePUBK.data.publicKey
    })

    it('should upload with act', async function () {
      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), 'act-1.txt', { act: true })
      expect(result.reference).toHaveLength(64)
      expect(result.historyAddress).toHaveLength(64)
    })

    it('should not be able to download without ACT header', async function () {
      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), 'act-1.txt', { act: true })
      await expect(bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference)).rejects.toThrow(
        'Request failed with status code 404',
      )
    })

    it('should not be able to download with ACT header but with wrong publicKey', async function () {
      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), 'act-2.txt', { act: true })
      const requestOptionsBad = actBeeKyOptions(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        result.historyAddress,
        '1',
      )
      await expect(bzz.downloadFile(requestOptionsBad, result.reference)).rejects.toThrow(
        'Request failed with status code 400',
      )
    })

    it('should download with ACT and valid publicKey', async function () {
      const filename = 'act-3.txt'
      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), filename, { act: true })
      const requestOptionsOK = actBeeKyOptions(publicKey, result.historyAddress, '1')
      const dFile = await bzz.downloadFile(requestOptionsOK, result.reference, filename)
      expect(Buffer.from(dFile.data).toString()).toBe(data)
    })
  })

  describe('collections', () => {
    it('should store and retrieve collection with single file', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch())
      const file = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).toBe(directoryStructure[0].path)
      expect(file.data.toString()).toEqual('0')
    })

    it('should retrieve the filename but not the complete path', async function () {
      const path = 'a/b/c/d/'
      const name = '0'
      const directoryStructure: Collection = [
        {
          path: `${path}${name}`,
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch())
      const file = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).toBe(name)
      expect(file.data.toString()).toBe('0')
    })

    it('should work with pinning', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch(), {
        pin: true,
      })
      const file = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).toBe(directoryStructure[0].path)
      expect(file.data.toString()).toBe('0')
    })

    it('should work with encryption', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch(), {
        encrypt: true,
      })
      const file = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).toBe(directoryStructure[0].path)
      expect(file.data.toString()).toBe('0')
      expect(result.reference.length).toBe(ENCRYPTED_REFERENCE_HEX_LENGTH)
    })

    it('should upload bigger file', async function () {
      if (!existsSync('test/primitives/32mb.bin')) {
        writeFileSync('test/primitives/32mb.bin', new Uint8Array(32 * 1024 * 1024))
      }

      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/32mb.bin',
          size: 32 * 1024 * 1024,
        },
      ]

      const response = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch())

      expect(response).toEqual(
        expect.objectContaining({
          reference: expect.any(String),
          tagUid: expect.any(Number),
        }),
      )
    })

    it('should store and retrieve collection', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
        {
          path: '1',
          fsPath: 'test/primitives/byte-01.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch())

      const file0 = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, directoryStructure[0].path)
      expect(file0.name).toBe(directoryStructure[0].path)
      expect(file0.data.toString()).toBe('0')

      const file1 = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, directoryStructure[1].path)
      expect(file1.name).toBe(directoryStructure[1].path)
      expect(file1.data.toString()).toBe('1')
    })

    it('should store and retrieve collection with index document', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
        {
          path: '1',
          fsPath: 'test/primitives/byte-01.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch(), {
        indexDocument: '1',
      })

      const indexFile = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference)
      expect(indexFile.name).toBe(directoryStructure[1].path)
      expect(indexFile.data.toString()).toBe('1')
    })

    it('should store and retrieve collection with error document', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
        {
          path: '1',
          fsPath: 'test/primitives/byte-01.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch(), {
        errorDocument: '0',
      })

      const errorFile = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, 'error')
      expect(errorFile.name).toBe(directoryStructure[0].path)
      expect(errorFile.data.toString()).toBe('0')
    })

    it('should store and retrieve actual directory', async function () {
      const path = 'test/data/'
      const dir = `./${path}`
      const file3Name = '3.txt'
      const subDir = 'sub/'
      const directoryStructure = await makeCollectionFromFS(dir)
      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch())

      const file3 = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference, `${subDir}${file3Name}`)
      expect(file3.name).toBe(file3Name)
      expect(file3.data.text()).toEqual(readFileSync('test/data/sub/3.txt', 'utf-8'))
    })

    it('should store and retrieve actual directory with index document', async function () {
      const path = 'test/data/'
      const dir = `./${path}`
      const fileName = '1.txt'
      const directoryStructure = await makeCollectionFromFS(dir)
      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch(), {
        indexDocument: `${fileName}`,
      })

      const file1 = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference)
      expect(file1.name).toBe(fileName)
      expect(file1.data.text()).toEqual(readFileSync('test/data/1.txt', 'utf-8'))
    })
  })

  describe('file', () => {
    it('should store and retrieve file', async function () {
      const data = 'hello world'
      const filename = 'hello.txt'

      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), filename)
      const fileData = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference)

      expect(Buffer.from(fileData.data).toString()).toBe(data)
      expect(fileData.name).toBe(filename)
    })

    it('should store file without filename', async function () {
      const data = 'hello world'

      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch())
      const fileData = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference)

      expect(Buffer.from(fileData.data).toString()).toBe(data)
    })

    it('should store readable file', async function () {
      const data = randomByteArray(5000, 1)
      const filename = 'hello.txt'

      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, Readable.from([data]), getPostageBatch(), filename, {
        size: data.length,
      })
      const fileData = await bzz.downloadFile(BEE_REQUEST_OPTIONS, result.reference)

      expect(JSON.stringify(fileData.data)).toEqual(JSON.stringify(data))
    })

    // TODO: flaky
    it.skip('should store file with a tag', async function () {
      // Relates to how many chunks is uploaded which depends on manifest serialization.
      // https://github.com/ethersphere/bee/pull/1501#discussion_r611385602
      const EXPECTED_TAGS_COUNT = 2

      const data = randomByteArray(5000, 2)
      const filename = 'hello.txt'

      const tag1 = await tag.createTag(BEE_REQUEST_OPTIONS)
      await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), filename, { tag: tag1.uid })
      const tag2 = await tag.retrieveTag(BEE_REQUEST_OPTIONS, tag1.uid)

      // TODO: Should be equal
      expect(tag2.split).toBeGreaterThanOrEqual(EXPECTED_TAGS_COUNT)
      expect(tag2.synced).toBeGreaterThanOrEqual(EXPECTED_TAGS_COUNT)
    })

    it('should catch error', async function () {
      await expect(bzz.downloadFile(BEE_REQUEST_OPTIONS, invalidReference)).rejects.toThrow(
        'Request failed with status code 404',
      )
    })

    it('should upload bigger file', async function () {
      const data = new Uint8Array(32 * 1024 * 1024)
      const response = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch())

      expect(response).toEqual(
        expect.objectContaining({
          reference: expect.any(String),
          tagUid: expect.any(Number),
        }),
      )
    })
  })
})
