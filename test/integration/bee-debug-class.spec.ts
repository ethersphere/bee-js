import { System } from 'cafe-utility'
import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
import { BeeArgumentError, BeeDebug } from '../../src'
import {
  beeDebugUrl,
  BLOCKCHAIN_TRANSACTION_TIMEOUT,
  getOrCreatePostageBatch,
  WAITING_USABLE_STAMP_TIMEOUT,
} from '../utils'

describe('Bee Debug class', () => {
  const BEE_DEBUG_URL = beeDebugUrl()
  const beeDebug = new BeeDebug(BEE_DEBUG_URL)

  describe('PostageBatch', () => {
    it('should create a new postage batch with zero amount and be usable', async function () {
      this.timeout(WAITING_USABLE_STAMP_TIMEOUT + BLOCKCHAIN_TRANSACTION_TIMEOUT)
      const batchId = await beeDebug.createPostageBatch('10', 17)
      const stamp = await beeDebug.getPostageBatch(batchId)
      expect(stamp.usable).to.eql(true)

      const allBatches = await beeDebug.getAllPostageBatch()
      expect(allBatches.find(batch => batch.batchID === batchId)).to.be.ok()
    })

    it('should not wait for the stamp to be usable if specified', async function () {
      this.timeout(BLOCKCHAIN_TRANSACTION_TIMEOUT)
      const batchId = await beeDebug.createPostageBatch('1000', 17, { waitForUsable: false })
      const stamp = await beeDebug.getPostageBatch(batchId)
      expect(stamp.usable).to.eql(false)
    })

    // TODO: Finish topup and dilute testing https://github.com/ethersphere/bee-js/issues/427
    it.skip('should topup postage batch', async function () {
      this.timeout(BLOCKCHAIN_TRANSACTION_TIMEOUT * 3)
      const batch = await getOrCreatePostageBatch(undefined, undefined, false)

      await beeDebug.topUpBatch(batch.batchID, '10')

      await System.sleepMillis(4000)
      const batchDetails = await beeDebug.getPostageBatch(batch.batchID)
      const newAmount = (parseInt(batch.amount) + 10).toString()
      expect(batchDetails.amount).to.eql(newAmount)
    })

    // TODO: Finish topup and dilute testing https://github.com/ethersphere/bee-js/issues/427
    it.skip('should dilute postage batch', async function () {
      this.timeout(BLOCKCHAIN_TRANSACTION_TIMEOUT * 2)
      const batch = await getOrCreatePostageBatch(undefined, 17, false)
      await beeDebug.diluteBatch(batch.batchID, batch.depth + 2)

      const batchDetails = await beeDebug.getPostageBatch(batch.batchID)
      expect(batchDetails.depth).to.eql(batch.depth + 2)
    })

    it('should have both immutable true and false', async function () {
      this.timeout(WAITING_USABLE_STAMP_TIMEOUT * 2 + BLOCKCHAIN_TRANSACTION_TIMEOUT * 4)
      await beeDebug.createPostageBatch('1', 17, { immutableFlag: true, waitForUsable: true })
      await beeDebug.createPostageBatch('1', 17, { immutableFlag: false, waitForUsable: true })
      const allBatches = await beeDebug.getAllPostageBatch()

      expect(allBatches.find(batch => batch.immutableFlag === true)).to.be.ok()
      expect(allBatches.find(batch => batch.immutableFlag === false)).to.be.ok()
    })

    it('should have all properties', async function () {
      const allBatches = await beeDebug.getAllPostageBatch()

      expect(allBatches.length).above(0)

      jestExpect(allBatches).toEqual(
        jestExpect.arrayContaining([
          jestExpect.objectContaining({
            batchID: jestExpect.any(String),
            utilization: jestExpect.any(Number),
            usable: jestExpect.any(Boolean),
            label: jestExpect.any(String),
            depth: jestExpect.any(Number),
            amount: jestExpect.any(String),
            bucketDepth: jestExpect.any(Number),
            blockNumber: jestExpect.any(Number),
            immutableFlag: jestExpect.any(Boolean),
            batchTTL: jestExpect.any(Number),
            exists: jestExpect.any(Boolean),
          }),
        ]),
      )
    })

    it('buckets should have all properties', async function () {
      const allBatches = await beeDebug.getAllPostageBatch()

      expect(allBatches.length).above(0)
      const batchId = allBatches[0].batchID
      const buckets = await beeDebug.getPostageBatchBuckets(batchId)

      jestExpect(buckets).toEqual(
        jestExpect.objectContaining({
          depth: jestExpect.any(Number),
          bucketDepth: jestExpect.any(Number),
          bucketUpperBound: jestExpect.any(Number),
          buckets: jestExpect.arrayContaining([
            jestExpect.objectContaining({
              bucketID: jestExpect.any(Number),
              collisions: jestExpect.any(Number),
            }),
          ]),
        }),
      )
    })

    it('should error with negative amount', async function () {
      await expect(beeDebug.createPostageBatch('-1', 17)).rejectedWith(BeeArgumentError)
    })
  })

  describe('modes', () => {
    it('should return modes', async function () {
      jestExpect(await beeDebug.getNodeInfo()).toEqual(
        jestExpect.objectContaining({
          beeMode: jestExpect.stringMatching(/^(dev|light|full)$/),
          chequebookEnabled: jestExpect.any(Boolean),
          swapEnabled: jestExpect.any(Boolean),
        }),
      )
    })
  })

  describe('staking', () => {
    it('should return amount staked', async function () {
      expect(await beeDebug.getStake()).to.match(/^[0-9]+$/)
    })

    it('should deposit stake', async function () {
      this.timeout(BLOCKCHAIN_TRANSACTION_TIMEOUT)
      const originalStake = BigInt(await beeDebug.getStake())

      await beeDebug.depositStake('100000000000000000')

      const increasedStake = BigInt(await beeDebug.getStake())

      expect(increasedStake - originalStake).to.eql(BigInt(10e16))
    })
  })

  describe('Wallet', () => {
    it('should return the nodes balances and other data', async function () {
      jestExpect(await beeDebug.getWalletBalance()).toEqual(
        jestExpect.objectContaining({
          bzzBalance: jestExpect.stringMatching(/^[0-9]+$/),
          nativeTokenBalance: jestExpect.stringMatching(/^[0-9]+$/),
          chainID: jestExpect.any(Number),
          chequebookContractAddress: jestExpect.stringMatching(/^0x[0-9a-f]{40}$/),
        }),
      )
    })
  })
})
