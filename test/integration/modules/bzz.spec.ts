import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
import { Readable } from 'stream'
import * as bzz from '../../../src/modules/bzz'
import * as tag from '../../../src/modules/tag'
import { BatchId, Collection, ENCRYPTED_REFERENCE_HEX_LENGTH } from '../../../src/types'
import { makeCollectionFromFS } from '../../../src/utils/collection.node'
import { http } from '../../../src/utils/http'
import {
  BIG_FILE_TIMEOUT,
  actBeeKyOptions,
  beeKyOptions,
  getPostageBatch,
  invalidReference,
  randomByteArray,
} from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

describe('modules/bzz', () => {
  describe('act', () => {
    const data = 'hello act'
    let publicKey: string
    let batchID: BatchId

    before(async () => {
      const responsePUBK = await http<{ publicKey: string }>(BEE_KY_OPTIONS, {
        method: 'get',
        url: 'addresses',
        responseType: 'json',
      })
      publicKey = responsePUBK.data.publicKey

      const responseBATCHID = await http<{ batchID: BatchId }>(BEE_KY_OPTIONS, {
        method: 'post',
        url: 'stamps/420000000/17',
        responseType: 'json',
      })
      batchID = responseBATCHID.data.batchID
    })

    it('should upload with act', async function () {
      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, batchID, 'act-1.txt', { act: true })
      expect(result.reference).to.have.lengthOf(64)
      expect(result.historyAddress).to.have.lengthOf(64)
    })

    it('should not be able to download without ACT header', async function () {
      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, batchID, 'act-1.txt', { act: true })
      await expect(bzz.downloadFile(BEE_KY_OPTIONS, result.reference)).to.be.rejectedWith(
        'Request failed with status code 404',
      )
    })

    it('should not be able to download with ACT header but with wrong publicKey', async function () {
      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, batchID, 'act-2.txt', { act: true })
      const requestOptionsBad = actBeeKyOptions(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        result.historyAddress,
        '1',
      )
      await expect(bzz.downloadFile(requestOptionsBad, result.reference)).rejectedWith(
        'Request failed with status code 400',
      )
    })

    it('should download with ACT and valid publicKey', async function () {
      const filename = 'act-3.txt'
      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, batchID, filename, { act: true })
      const requestOptionsOK = actBeeKyOptions(publicKey, result.historyAddress, '1')
      const dFile = await bzz.downloadFile(requestOptionsOK, result.reference, filename)
      expect(Buffer.from(dFile.data).toString()).to.eql(data)
    })
  })

  describe('collections', () => {
    it('should store and retrieve collection with single file', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch())
      const file = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).to.eql(directoryStructure[0].path)
      expect(file.data).to.eql(directoryStructure[0].data)
    })

    it('should retrieve the filename but not the complete path', async function () {
      const path = 'a/b/c/d/'
      const name = '0'
      const directoryStructure: Collection = [
        {
          path: `${path}${name}`,
          data: Uint8Array.from([0]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch())
      const file = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).to.eql(name)
      expect(file.data).to.eql(directoryStructure[0].data)
    })

    it('should work with pinning', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch(), { pin: true })
      const file = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).to.eql(directoryStructure[0].path)
      expect(file.data).to.eql(directoryStructure[0].data)
    })

    it('should work with encryption', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch(), {
        encrypt: true,
      })
      const file = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, directoryStructure[0].path)

      expect(file.name).to.eql(directoryStructure[0].path)
      expect(file.data).to.eql(directoryStructure[0].data)
      expect(result.reference.length).to.eql(ENCRYPTED_REFERENCE_HEX_LENGTH)
    })

    it('should upload bigger file', async function () {
      this.timeout(BIG_FILE_TIMEOUT)
      const directoryStructure: Collection = [
        {
          path: '0',
          data: new Uint8Array(32 * 1024 * 1024),
        },
      ]

      const response = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch())

      jestExpect(response).toEqual(
        jestExpect.objectContaining({
          reference: jestExpect.any(String),
          tagUid: jestExpect.any(Number),
        }),
      )
    })

    it('should store and retrieve collection', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
        {
          path: '1',
          data: Uint8Array.from([1]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch())

      const file0 = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, directoryStructure[0].path)
      expect(file0.name).to.eql(directoryStructure[0].path)
      expect(file0.data).to.eql(directoryStructure[0].data)

      const file1 = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, directoryStructure[1].path)
      expect(file1.name).to.eql(directoryStructure[1].path)
      expect(file1.data).to.eql(directoryStructure[1].data)
    })

    it('should store and retrieve collection with index document', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
        {
          path: '1',
          data: Uint8Array.from([1]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch(), {
        indexDocument: '0',
      })

      const indexFile = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference)
      expect(indexFile.name).to.eql(directoryStructure[0].path)
      expect(indexFile.data).to.eql(directoryStructure[0].data)
    })

    it('should store and retrieve collection with error document', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
        {
          path: '1',
          data: Uint8Array.from([1]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch(), {
        errorDocument: '0',
      })

      const errorFile = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, 'error')
      expect(errorFile.name).to.eql(directoryStructure[0].path)
      expect(errorFile.data).to.eql(directoryStructure[0].data)
    })

    it('should store and retrieve actual directory', async function () {
      const path = 'test/data/'
      const dir = `./${path}`
      const file3Name = '3.txt'
      const subDir = 'sub/'
      const data = Uint8Array.from([51, 10])
      const directoryStructure = await makeCollectionFromFS(dir)
      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch())

      const file3 = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference, `${subDir}${file3Name}`)
      expect(file3.name).to.eql(file3Name)
      expect(file3.data).to.eql(data)
    })

    it('should store and retrieve actual directory with index document', async function () {
      const path = 'test/data/'
      const dir = `./${path}`
      const fileName = '1.txt'
      const data = Uint8Array.from([49, 10])
      const directoryStructure = await makeCollectionFromFS(dir)
      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch(), {
        indexDocument: `${fileName}`,
      })

      const file1 = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference)
      expect(file1.name).to.eql(fileName)
      expect(file1.data).to.eql(data)
    })
  })

  describe('file', () => {
    it('should store and retrieve file', async function () {
      const data = 'hello world'
      const filename = 'hello.txt'

      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, getPostageBatch(), filename)
      const fileData = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference)

      expect(Buffer.from(fileData.data).toString()).to.eql(data)
      expect(fileData.name).to.eql(filename)
    })

    it('should store file without filename', async function () {
      const data = 'hello world'

      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, getPostageBatch())
      const fileData = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference)

      expect(Buffer.from(fileData.data).toString()).to.eql(data)
    })

    it('should store readable file', async function () {
      const data = randomByteArray(5000, 1)
      const filename = 'hello.txt'

      const result = await bzz.uploadFile(BEE_KY_OPTIONS, Readable.from([data]), getPostageBatch(), filename, {
        size: data.length,
      })
      const fileData = await bzz.downloadFile(BEE_KY_OPTIONS, result.reference)

      expect(fileData.data).to.eql(data)
    })

    it('should store file with a tag', async function () {
      this.timeout(BIG_FILE_TIMEOUT)

      // Relates to how many chunks is uploaded which depends on manifest serialization.
      // https://github.com/ethersphere/bee/pull/1501#discussion_r611385602
      const EXPECTED_TAGS_COUNT = 2

      const data = randomByteArray(5000, 2)
      const filename = 'hello.txt'

      const tag1 = await tag.createTag(BEE_KY_OPTIONS)
      await bzz.uploadFile(BEE_KY_OPTIONS, data, getPostageBatch(), filename, { tag: tag1.uid })
      const tag2 = await tag.retrieveTag(BEE_KY_OPTIONS, tag1.uid)

      expect(tag2.split).to.eql(EXPECTED_TAGS_COUNT)
      expect(tag2.synced).to.eql(EXPECTED_TAGS_COUNT)
    })

    it('should catch error', async function () {
      this.timeout(BIG_FILE_TIMEOUT)
      await expect(bzz.downloadFile(BEE_KY_OPTIONS, invalidReference)).rejectedWith(
        'Request failed with status code 404',
      )
    })

    it('should upload bigger file', async function () {
      this.timeout(BIG_FILE_TIMEOUT)
      const data = new Uint8Array(32 * 1024 * 1024)
      const response = await bzz.uploadFile(BEE_KY_OPTIONS, data, getPostageBatch())

      jestExpect(response).toEqual(
        jestExpect.objectContaining({
          reference: jestExpect.any(String),
          tagUid: jestExpect.any(Number),
        }),
      )
    })
  })
})
