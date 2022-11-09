import { BeeArgumentError, BeeDebug } from '../../src'
import {
  beeDebugUrl,
  commonMatchers,
  getOrCreatePostageBatch,
  BLOCKCHAIN_TRANSACTION_TIMEOUT,
  WAITING_USABLE_STAMP_TIMEOUT,
} from '../utils'
import { sleep } from '../../src/utils/sleep'

commonMatchers()

describe('Bee Debug class', () => {
  const BEE_DEBUG_URL = beeDebugUrl()
  const beeDebug = new BeeDebug(BEE_DEBUG_URL)

  describe('PostageBatch', () => {
    it(
      'should create a new postage batch with zero amount and be usable',
      async () => {
        const batchId = await beeDebug.createPostageBatch('10', 17)
        const stamp = await beeDebug.getPostageBatch(batchId)
        expect(stamp.usable).toEqual(true)

        const allBatches = await beeDebug.getAllPostageBatch()
        expect(allBatches.find(batch => batch.batchID === batchId)).toBeTruthy()
      },
      WAITING_USABLE_STAMP_TIMEOUT + BLOCKCHAIN_TRANSACTION_TIMEOUT,
    )

    it(
      'should not wait for the stamp to be usable if specified',
      async () => {
        const batchId = await beeDebug.createPostageBatch('1000', 17, { waitForUsable: false })
        const stamp = await beeDebug.getPostageBatch(batchId)
        expect(stamp.usable).toEqual(false)
      },
      BLOCKCHAIN_TRANSACTION_TIMEOUT,
    )

    // TODO: Finish topup and dilute testing https://github.com/ethersphere/bee-js/issues/427
    it.skip(
      'should topup postage batch',
      async () => {
        const batch = await getOrCreatePostageBatch(undefined, undefined, false)

        await beeDebug.topUpBatch(batch.batchID, '10')

        await sleep(4000)
        const batchDetails = await beeDebug.getPostageBatch(batch.batchID)
        const newAmount = (parseInt(batch.amount) + 10).toString()
        expect(batchDetails.amount).toEqual(newAmount)
      },
      BLOCKCHAIN_TRANSACTION_TIMEOUT * 3,
    )

    // TODO: Finish topup and dilute testing https://github.com/ethersphere/bee-js/issues/427
    it.skip(
      'should dilute postage batch',
      async () => {
        const batch = await getOrCreatePostageBatch(undefined, 17, false)
        await beeDebug.diluteBatch(batch.batchID, batch.depth + 2)

        const batchDetails = await beeDebug.getPostageBatch(batch.batchID)
        expect(batchDetails.depth).toEqual(batch.depth + 2)
      },
      BLOCKCHAIN_TRANSACTION_TIMEOUT * 2,
    )

    it(
      'should have both immutable true and false',
      async () => {
        await beeDebug.createPostageBatch('1', 17, { immutableFlag: true, waitForUsable: false })
        await beeDebug.createPostageBatch('1', 17, { immutableFlag: false, waitForUsable: false })
        const allBatches = await beeDebug.getAllPostageBatch()

        expect(allBatches.find(batch => batch.immutableFlag === true)).toBeTruthy()
        expect(allBatches.find(batch => batch.immutableFlag === false)).toBeTruthy()
      },
      BLOCKCHAIN_TRANSACTION_TIMEOUT * 2,
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

  describe('modes', () => {
    it('should return modes', async () => {
      expect(await beeDebug.getNodeInfo()).toEqual(
        expect.objectContaining({
          beeMode: expect.stringMatching(/^(dev|light|full)$/),
          chequebookEnabled: expect.any(Boolean),
          swapEnabled: expect.any(Boolean),
        }),
      )
    })
  })

  describe('Wallet', () => {
    it('should return the nodes balances and other data', async () => {
      expect(await beeDebug.getWalletBalance()).toEqual(
        expect.objectContaining({
          bzz: expect.stringMatching(/^[0-9]+$/),
          xDai: expect.stringMatching(/^[0-9]+$/),
          chainID: expect.any(Number),
          contractAddress: expect.stringMatching(/^0x[0-9a-f]{40}$/),
        }),
      )
    })
  })
})
