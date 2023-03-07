import { expect } from 'chai'
import * as bytes from '../../../src/modules/bytes'
import * as bzz from '../../../src/modules/bzz'
import * as chunk from '../../../src/modules/chunk'
import * as pinning from '../../../src/modules/pinning'
import { Collection } from '../../../src/types'
import {
  beeKyOptions,
  commonMatchers,
  ERR_TIMEOUT,
  getPostageBatch,
  invalidReference,
  randomByteArray,
  testChunkData,
  testChunkHash,
} from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()
commonMatchers()

describe('modules/pin', () => {
  describe('should work with files', () => {
    const randomData = randomByteArray(5000)

    it('should pin an existing file', async function () {
      const result = await bzz.uploadFile(BEE_KY_OPTIONS, randomData, getPostageBatch())
      await pinning.pin(BEE_KY_OPTIONS, result.reference)
    })

    it('should unpin an existing file', async function () {
      const result = await bzz.uploadFile(BEE_KY_OPTIONS, randomData, getPostageBatch())
      await pinning.unpin(BEE_KY_OPTIONS, result.reference)
    })

    it('should not pin a non-existing file', async function () {
      this.timeout(ERR_TIMEOUT)

      await expect(pinning.pin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })

    it('should not unpin a non-existing file', async function () {
      await expect(pinning.unpin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
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

    it('should pin an existing collection', async function () {
      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, testCollection, getPostageBatch())
      await pinning.pin(BEE_KY_OPTIONS, result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should unpin an existing collections', async function () {
      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, testCollection, getPostageBatch())
      await pinning.unpin(BEE_KY_OPTIONS, result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should not pin a non-existing collections', async function () {
      this.timeout(ERR_TIMEOUT)

      await expect(pinning.pin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })

    it('should not unpin a non-existing collections', async function () {
      await expect(pinning.unpin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })
  })

  describe('should work with data', () => {
    const randomData = randomByteArray(5000)

    it('should pin existing data', async function () {
      const result = await bytes.upload(BEE_KY_OPTIONS, randomData, getPostageBatch())
      await pinning.pin(BEE_KY_OPTIONS, result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should unpin existing data', async function () {
      const result = await bytes.upload(BEE_KY_OPTIONS, randomData, getPostageBatch())
      await pinning.pin(BEE_KY_OPTIONS, result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should not pin a non-existing data', async function () {
      this.timeout(ERR_TIMEOUT)

      await expect(pinning.pin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })

    it('should not unpin a non-existing data', async function () {
      await expect(pinning.unpin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })
  })

  describe('should work with chunks', () => {
    it('should pin existing chunk', async function () {
      const chunkReference = await chunk.upload(BEE_KY_OPTIONS, testChunkData, getPostageBatch())
      expect(chunkReference).to.eql(testChunkHash)

      await pinning.pin(BEE_KY_OPTIONS, testChunkHash) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should unpin existing chunk', async function () {
      const chunkReference = await chunk.upload(BEE_KY_OPTIONS, testChunkData, getPostageBatch())
      expect(chunkReference).to.eql(testChunkHash)

      await pinning.unpin(BEE_KY_OPTIONS, testChunkHash) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should not pin a non-existing chunk', async function () {
      this.timeout(ERR_TIMEOUT)

      await expect(pinning.pin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })

    it('should not unpin a non-existing chunk', async function () {
      await expect(pinning.unpin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })

    it('should return pinning status of existing chunk', async function () {
      const chunkReference = await chunk.upload(BEE_KY_OPTIONS, testChunkData, getPostageBatch())
      expect(chunkReference).to.eql(testChunkHash)

      await pinning.pin(BEE_KY_OPTIONS, testChunkHash) // Nothing is asserted as nothing is returned, will throw error if something is wrong
      const pinningStatus = await pinning.getPin(BEE_KY_OPTIONS, testChunkHash)
      expect(pinningStatus.reference).to.eql(testChunkHash)
    })

    it('should not return pinning status of non-existing chunk', async function () {
      await expect(pinning.getPin(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
    })

    it('should return list of pinned chunks', async function () {
      const chunkReference = await chunk.upload(BEE_KY_OPTIONS, testChunkData, getPostageBatch())
      expect(chunkReference).to.eql(testChunkHash)

      await pinning.pin(BEE_KY_OPTIONS, testChunkHash) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })
  })
})
