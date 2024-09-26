import { System } from 'cafe-utility'
import { Bee, BeeArgumentError } from '../../src'
import { DEFAULT_BATCH_AMOUNT, beeUrl, getOrCreatePostageBatch } from '../utils'

describe('Bee class debug modules', () => {
  const BEE_URL = beeUrl()
  const bee = new Bee(BEE_URL)

  describe('PostageBatch', () => {
    // TODO: Finish testing
    it.skip('should create a new postage batch with zero amount and be usable', async function () {
      const batchId = await bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17)
      const stamp = await bee.getPostageBatch(batchId)
      expect(stamp.usable).toBe(true)

      const allBatches = await bee.getAllPostageBatch()
      expect(allBatches.find(batch => batch.batchID === batchId)).toBeTruthy()
    })

    // TODO: Finish testing
    it.skip('should not wait for the stamp to be usable if specified', async function () {
      const batchId = await bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { waitForUsable: false })
      const stamp = await bee.getPostageBatch(batchId)
      expect(stamp.usable).toBe(false)
    })

    // TODO: Finish topup and dilute testing https://github.com/ethersphere/bee-js/issues/427
    it.skip('should topup postage batch', async function () {
      const batch = await getOrCreatePostageBatch(undefined, undefined, false)

      await bee.topUpBatch(batch.batchID, '10')

      await System.sleepMillis(4000)
      const batchDetails = await bee.getPostageBatch(batch.batchID)
      const newAmount = (parseInt(batch.amount) + 10).toString()
      expect(batchDetails.amount).toBe(newAmount)
    })

    // TODO: Finish topup and dilute testing https://github.com/ethersphere/bee-js/issues/427
    it.skip('should dilute postage batch', async function () {
      const batch = await getOrCreatePostageBatch(undefined, 17, false)
      await bee.diluteBatch(batch.batchID, batch.depth + 2)

      const batchDetails = await bee.getPostageBatch(batch.batchID)
      expect(batchDetails.depth).toBe(batch.depth + 2)
    })

    // TODO: Finish testing
    it.skip('should have both immutable true and false', async function () {
      await bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { immutableFlag: true, waitForUsable: true })
      await bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { immutableFlag: false, waitForUsable: true })
      const allBatches = await bee.getAllPostageBatch()

      expect(allBatches.find(batch => batch.immutableFlag === true)).toBeTruthy()
      expect(allBatches.find(batch => batch.immutableFlag === false)).toBeTruthy()
    })

    it('should have all properties', async function () {
      const allBatches = await bee.getAllPostageBatch()

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

    it('buckets should have all properties', async function () {
      const allBatches = await bee.getAllPostageBatch()

      expect(allBatches.length).toBeGreaterThan(0)
      const batchId = allBatches[0].batchID
      const buckets = await bee.getPostageBatchBuckets(batchId)

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

    it('should error with negative amount', async function () {
      await expect(bee.createPostageBatch('-1', 17)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('modes', () => {
    it('should return modes', async function () {
      expect(await bee.getNodeInfo()).toEqual(
        expect.objectContaining({
          beeMode: expect.stringMatching(/^(dev|light|full)$/),
          chequebookEnabled: expect.any(Boolean),
          swapEnabled: expect.any(Boolean),
        }),
      )
    })
  })

  // TODO: Finish testing
  describe.skip('staking', () => {
    it('should return amount staked', async function () {
      expect(await bee.getStake()).toMatch(/^[0-9]+$/)
    })

    it('should deposit stake', async function () {
      const originalStake = BigInt(await bee.getStake())

      await bee.depositStake('100000000000000000')

      const increasedStake = BigInt(await bee.getStake())

      expect(increasedStake - originalStake).toBe(BigInt(10e16))
    })
  })

  describe('Wallet', () => {
    it('should return the nodes balances and other data', async function () {
      expect(await bee.getWalletBalance()).toEqual(
        expect.objectContaining({
          bzzBalance: expect.stringMatching(/^[0-9]+$/),
          nativeTokenBalance: expect.stringMatching(/^[0-9]+$/),
          chainID: expect.any(Number),
          chequebookContractAddress: expect.stringMatching(/^0x[0-9a-f]{40}$/),
        }),
      )
    })
  })
})
