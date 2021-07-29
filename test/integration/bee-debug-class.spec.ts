import { BeeArgumentError, BeeDebug } from '../../src'
import { beeDebugUrl, commonMatchers, POSTAGE_BATCH_TIMEOUT } from '../utils'

commonMatchers()

describe('Bee Debug class', () => {
  const BEE_DEBUG_URL = beeDebugUrl()
  const beeDebug = new BeeDebug(BEE_DEBUG_URL)

  describe('PostageBatch', () => {
    it(
      'should create a new postage batch with zero amount',
      async () => {
        const batchId = await beeDebug.createPostageBatch('0', 17)
        const allBatches = await beeDebug.getAllPostageBatch()

        expect(allBatches.find(batch => batch.batchID === batchId)).toBeTruthy()
      },
      POSTAGE_BATCH_TIMEOUT,
    )

    it(
      'should have both immutable true and false',
      async () => {
        await beeDebug.createPostageBatch('1', 17, { immutableFlag: true })
        await beeDebug.createPostageBatch('1', 17, { immutableFlag: false })
        const allBatches = await beeDebug.getAllPostageBatch()

        expect(allBatches.find(batch => batch.immutableFlag === true)).toBeTruthy()
        expect(allBatches.find(batch => batch.immutableFlag === false)).toBeTruthy()
      },
      POSTAGE_BATCH_TIMEOUT * 2,
    )

    it('should have all properties', async () => {
      const allBatches = await beeDebug.getAllPostageBatch()

      expect(allBatches.length).toBeGreaterThan(0)

      expect(allBatches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            batchID: expect.any(String),
            utilization: expect.any(Number),
            usable: expect.any(Boolean),
            label: expect.any(String),
            depth: expect.any(Number),
            amount: expect.any(String),
            bucketDepth: expect.any(Number),
            blockNumber: expect.any(Number),
            immutableFlag: expect.any(Boolean),
            batchTTL: expect.any(Number),
            exists: expect.any(Boolean),
          }),
        ]),
      )
    })

    it('buckets should have all properties', async () => {
      const allBatches = await beeDebug.getAllPostageBatch()

      expect(allBatches.length).toBeGreaterThan(0)
      const batchId = allBatches[0].batchID
      const buckets = await beeDebug.getPostageBatchBuckets(batchId)

      expect(buckets).toEqual(
        expect.objectContaining({
          depth: expect.any(Number),
          bucketDepth: expect.any(Number),
          bucketUpperBound: expect.any(Number),
          buckets: expect.arrayContaining([
            expect.objectContaining({
              bucketID: expect.any(Number),
              collisions: expect.any(Number),
            }),
          ]),
        }),
      )
    })

    it('should error with negative amount', async () => {
      await expect(beeDebug.createPostageBatch('-1', 17)).rejects.toThrowError(BeeArgumentError)
    })
  })
})
