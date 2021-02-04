import * as pinning from '../../src/modules/pinning'
import * as file from '../../src/modules/file'
import * as collection from '../../src/modules/collection'
import * as bytes from '../../src/modules/bytes'
import * as chunk from '../../src/modules/chunk'
import { beeUrl, invalidReference, okResponse, randomByteArray, testChunkData, testChunkHash } from '../utils'
import { Collection } from '../../src/types'

const BEE_URL = beeUrl()

describe('modules/pin', () => {
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

    it('should pin an existing collection', async () => {
      const hash = await collection.upload(BEE_URL, testCollection)
      const response = await pinning.pinCollection(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should unpin an existing collections', async () => {
      const hash = await collection.upload(BEE_URL, testCollection)
      const response = await pinning.unpinCollection(BEE_URL, hash)

      expect(response).toEqual(okResponse)
    })

    it('should not pin a non-existing collections', async () => {
      await expect(pinning.pinCollection(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should not unpin a non-existing collections', async () => {
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

    it('should not pin a non-existing data', async () => {
      await expect(pinning.pinData(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should not unpin a non-existing data', async () => {
      await expect(pinning.unpinData(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })
  })

  describe('should work with chunks', () => {
    it('should pin existing chunk', async () => {
      const chunkResponse = await chunk.upload(BEE_URL, testChunkHash, testChunkData)
      expect(chunkResponse).toEqual({ reference: testChunkHash })

      const pinningResponse = await pinning.pinChunk(BEE_URL, testChunkHash)
      expect(pinningResponse).toEqual(okResponse)
    })

    it('should unpin existing chunk', async () => {
      const chunkResponse = await chunk.upload(BEE_URL, testChunkHash, testChunkData)
      expect(chunkResponse).toEqual({ reference: testChunkHash })

      const pinningResponse = await pinning.unpinChunk(BEE_URL, testChunkHash)
      expect(pinningResponse).toEqual(okResponse)
    })

    it('should not pin a non-existing chunk', async () => {
      await expect(pinning.pinChunk(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should not unpin a non-existing chunk', async () => {
      await expect(pinning.unpinChunk(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should return pinning status of existing chunk', async () => {
      const chunkResponse = await chunk.upload(BEE_URL, testChunkHash, testChunkData)
      expect(chunkResponse).toEqual({ reference: testChunkHash })

      const pinningResponse = await pinning.pinChunk(BEE_URL, testChunkHash)
      expect(pinningResponse).toEqual(okResponse)

      const pinningStatus = await pinning.getChunkPinningStatus(BEE_URL, testChunkHash)
      expect(pinningStatus.address).toEqual(testChunkHash)
      expect(pinningStatus.pinCounter).toBeGreaterThan(0)
    })

    it('should not return pinning status of non-existing chunk', async () => {
      await expect(pinning.getChunkPinningStatus(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
    })

    it('should return pinning status of existing chunk', async () => {
      const chunkResponse = await chunk.upload(BEE_URL, testChunkHash, testChunkData)
      expect(chunkResponse).toEqual({ reference: testChunkHash })

      const pinningResponse = await pinning.pinChunk(BEE_URL, testChunkHash)
      expect(pinningResponse).toEqual(okResponse)

      const pinCounter = 100
      const pinningStatus = await pinning.updateChunkPinCounter(BEE_URL, testChunkHash, pinCounter)
      expect(pinningStatus.address).toEqual(testChunkHash)
      expect(pinningStatus.pinCounter).toBe(pinCounter)
    })

    it('should return list of pinned chunks', async () => {
      const chunkResponse = await chunk.upload(BEE_URL, testChunkHash, testChunkData)
      expect(chunkResponse).toEqual({ reference: testChunkHash })

      const pinningResponse = await pinning.pinChunk(BEE_URL, testChunkHash)
      expect(pinningResponse).toEqual(okResponse)

      const pinnedChunks = await pinning.getPinnedChunks(BEE_URL, { limit: 2_147_483_647 })
      expect(pinnedChunks.chunks.length).toBeGreaterThan(0)
      expect(pinnedChunks.chunks.map(status => status.address)).toContain(testChunkHash)
    })
  })
})
