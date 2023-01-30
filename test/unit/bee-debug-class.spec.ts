import {
  assertAllIsDone,
  cashoutLastChequeMock,
  createPostageBatchMock,
  depositTokensMock,
  MOCK_SERVER_URL,
  withdrawTokensMock,
} from './nock'
import { BatchId, BeeArgumentError, BeeDebug, CashoutOptions, PostageBatchOptions, RequestOptions } from '../../src'
import { testAddress, testBatchId } from '../utils'
import {
  testAddressAssertions,
  testBatchIdAssertion,
  testTransactionOptionsAssertions,
  testPostageBatchOptionsAssertions,
  testRequestOptionsAssertions,
} from './assertions'
import { fail } from 'assert'
import { expect } from 'chai'

const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
const CASHOUT_RESPONSE = {
  transactionHash: TRANSACTION_HASH,
}

describe('BeeDebug class', () => {
  function testUrl(url: unknown): void {
    it(`should not accept invalid url '${url}'`, () => {
      try {
        new BeeDebug(url as string)
        fail('BeeDebug constructor should have thrown error.')
      } catch (e) {
        if (e instanceof BeeArgumentError) {
          expect(e.value).to.eql(url)

          return
        }

        throw e
      }
    })
  }

  testUrl('')
  testUrl(null)
  testUrl(undefined)
  testUrl(1)
  testUrl('some-invalid-url')
  testUrl('invalid:protocol')
  // eslint-disable-next-line no-script-url
  testUrl('javascript:console.log()')
  testUrl('ws://localhost:1633')

  it('should set default headers and use them if specified', async function () {
    depositTokensMock('10', undefined, { 'X-Awesome-Header': '123' }).reply(201, CASHOUT_RESPONSE)

    const bee = new BeeDebug(MOCK_SERVER_URL, { defaultHeaders: { 'X-Awesome-Header': '123' } })
    await expect(bee.depositTokens('10')).eventually.to.eql(TRANSACTION_HASH)

    assertAllIsDone()
  })

  describe('removePeer', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.removePeer(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.removePeer(input as string)
    })
  })

  describe('pingPeer', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.pingPeer(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.pingPeer(input as string)
    })
  })

  describe('getPeerBalance', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getPeerBalance(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPeerBalance(input as string)
    })
  })

  describe('getPastDueConsumptionPeerBalance', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getPastDueConsumptionPeerBalance(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPastDueConsumptionPeerBalance(input as string)
    })
  })

  describe('getLastChequesForPeer', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getLastChequesForPeer(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getLastChequesForPeer(input as string)
    })
  })

  describe('getLastCashoutAction', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getLastCashoutAction(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getLastCashoutAction(input as string)
    })
  })

  describe('getSettlements', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getSettlements(testAddress, input as RequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getSettlements(input as string)
    })
  })

  describe('cashoutLastCheque', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.cashoutLastCheque(testAddress, input as RequestOptions)
    })

    testTransactionOptionsAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.cashoutLastCheque('', input as CashoutOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      cashoutLastChequeMock(testAddress).reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress)).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      cashoutLastChequeMock(testAddress, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: '100000000000' })).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas limit is specified', async function () {
      cashoutLastChequeMock(testAddress, undefined, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: '100000000000' })).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.cashoutLastCheque(input as string)
    })
  })

  describe('withdrawTokens', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.withdrawTokens('1', '0', input as RequestOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      withdrawTokensMock('10').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.withdrawTokens('10')).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      withdrawTokensMock('10', '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.withdrawTokens('10', '100000000000')).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should throw error if passed wrong amount', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens(true)).rejectedWith(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens('asd')).rejectedWith(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens(null)).rejectedWith(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens()).rejectedWith(TypeError)

      await expect(bee.withdrawTokens('-1')).rejectedWith(BeeArgumentError)
    })

    it('should throw error if passed wrong gas price input', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens('1', true)).rejectedWith(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens('1', 'asd')).rejectedWith(TypeError)
      await expect(bee.withdrawTokens('1', '-1')).rejectedWith(BeeArgumentError)
    })
  })

  describe('depositTokens', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.depositTokens('1', '0', input as RequestOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      depositTokensMock('10').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.depositTokens('10')).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      depositTokensMock('10', '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.depositTokens('10', '100000000000')).eventually.to.eql(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should throw error if passed wrong amount', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens(true)).rejectedWith(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens('asd')).rejectedWith(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens(null)).rejectedWith(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens()).rejectedWith(TypeError)

      await expect(bee.depositTokens('-1')).rejectedWith(BeeArgumentError)
    })

    it('should throw error if passed wrong gas price input', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens('1', true)).rejectedWith(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens('1', 'asd')).rejectedWith(TypeError)
      await expect(bee.depositTokens('1', '-1')).rejectedWith(BeeArgumentError)
    })
  })

  describe('retrieveExtendedTag', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.retrieveExtendedTag(0, input as RequestOptions)
    })

    it('should throw exception for bad Tag', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag('')).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag(true)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag([])).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({})).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag(null)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag(undefined)).rejectedWith(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({ total: true })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({ total: 'asdf' })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({ total: null })).rejectedWith(TypeError)

      await expect(bee.retrieveExtendedTag(-1)).rejectedWith(BeeArgumentError)
    })
  })

  describe('getStake', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getStake(input as RequestOptions)
    })
  })

  describe('depositStake', () => {
    const testStakingAmount = '100000000000000000'
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.depositStake(testStakingAmount, input as RequestOptions)
    })

    testTransactionOptionsAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.depositStake(testStakingAmount, input as RequestOptions)
    })
  })

  describe('createPostageBatch', () => {
    const BATCH_ID = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const BATCH_RESPONSE = {
      batchID: BATCH_ID,
    }

    testPostageBatchOptionsAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.createPostageBatch('10', 17, input as PostageBatchOptions)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.createPostageBatch('10', 17, input as RequestOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      createPostageBatchMock('10', '17').reply(201, BATCH_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17, { waitForUsable: false })).eventually.to.eql(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      createPostageBatchMock('10', '17', '100').reply(201, BATCH_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17, { waitForUsable: false, gasPrice: '100' })).eventually.to.eql(
        BATCH_ID,
      )
      assertAllIsDone()
    })

    it('should throw error if passed wrong immutable input', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: 'asd' })).rejectedWith(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: -1 })).rejectedWith(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: 'true' })).rejectedWith(TypeError)
    })

    it('should throw error if too small depth', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('10', -1)).rejectedWith(BeeArgumentError)
      await expect(bee.createPostageBatch('10', 15)).rejectedWith(BeeArgumentError)
    })

    it('should throw error if too small amount', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('-10', 17)).rejectedWith(BeeArgumentError)
      await expect(bee.createPostageBatch('0', 17)).rejectedWith(BeeArgumentError)
    })

    it('should throw error if too big depth', async function () {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('10', 256)).rejectedWith(BeeArgumentError)
    })
  })

  describe('getPostageBatch', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getPostageBatch(testBatchId, input as RequestOptions)
    })

    testBatchIdAssertion(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPostageBatch(input as BatchId)
    })
  })

  describe('getPostageBatchBuckets', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new BeeDebug(MOCK_SERVER_URL, beeOptions)

      return bee.getPostageBatchBuckets(testBatchId, input as RequestOptions)
    })

    testBatchIdAssertion(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPostageBatchBuckets(input as BatchId)
    })
  })
})
