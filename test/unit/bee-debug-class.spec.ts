import { BatchId, Bee, BeeArgumentError, BeeRequestOptions, CashoutOptions, PostageBatchOptions } from '../../src'
import { DEFAULT_BATCH_AMOUNT, testAddress, testBatchId } from '../utils'
import {
  testAddressAssertions,
  testBatchIdAssertion,
  testPostageBatchOptionsAssertions,
  testRequestOptionsAssertions,
  testTransactionOptionsAssertions,
} from './assertions'
import {
  MOCK_SERVER_URL,
  assertAllIsDone,
  cashoutLastChequeMock,
  createPostageBatchMock,
  depositTokensMock,
  withdrawTokensMock,
} from './nock'

const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
const CASHOUT_RESPONSE = {
  transactionHash: TRANSACTION_HASH,
}

describe('Bee class debug modules', () => {
  function testUrl(url: unknown): void {
    it(`should not accept invalid url '${url}'`, () => {
      try {
        new Bee(url as string)
        fail('Bee constructor should have thrown error.')
      } catch (e) {
        if (e instanceof BeeArgumentError) {
          expect(e.value).toBe(url)

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

    const bee = new Bee(MOCK_SERVER_URL, { headers: { 'X-Awesome-Header': '123' } })
    expect(await bee.depositTokens('10')).toBe(TRANSACTION_HASH)

    assertAllIsDone()
  })

  describe('removePeer', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.removePeer(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.removePeer(input as string)
    })
  })

  describe('pingPeer', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.pingPeer(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pingPeer(input as string)
    })
  })

  describe('getPeerBalance', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getPeerBalance(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPeerBalance(input as string)
    })
  })

  describe('getPastDueConsumptionPeerBalance', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getPastDueConsumptionPeerBalance(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPastDueConsumptionPeerBalance(input as string)
    })
  })

  describe('getLastChequesForPeer', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getLastChequesForPeer(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getLastChequesForPeer(input as string)
    })
  })

  describe('getLastCashoutAction', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getLastCashoutAction(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getLastCashoutAction(input as string)
    })
  })

  describe('getSettlements', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getSettlements(testAddress, input as BeeRequestOptions)
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getSettlements(input as string)
    })
  })

  describe('cashoutLastCheque', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.cashoutLastCheque(testAddress, undefined, input as BeeRequestOptions)
    })

    testTransactionOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.cashoutLastCheque('', input as CashoutOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      cashoutLastChequeMock(testAddress).reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.cashoutLastCheque(testAddress)).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      cashoutLastChequeMock(testAddress, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.cashoutLastCheque(testAddress, { gasPrice: '100000000000' })).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas limit is specified', async function () {
      cashoutLastChequeMock(testAddress, undefined, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.cashoutLastCheque(testAddress, { gasLimit: '100000000000' })).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.cashoutLastCheque(input as string)
    })
  })

  describe('withdrawTokens', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.withdrawTokens('1', '0', input as BeeRequestOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      withdrawTokensMock('10').reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.withdrawTokens('10')).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      withdrawTokensMock('10', '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.withdrawTokens('10', '100000000000')).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should throw error if passed wrong amount', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens(true)).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens('asd')).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens(null)).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens()).rejects.toThrow(TypeError)

      await expect(bee.withdrawTokens('-1')).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if passed wrong gas price input', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens('1', true)).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.withdrawTokens('1', 'asd')).rejects.toThrow(TypeError)
      await expect(bee.withdrawTokens('1', '-1')).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('depositTokens', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.depositTokens('1', '0', input as BeeRequestOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      depositTokensMock('10').reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.depositTokens('10')).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      depositTokensMock('10', '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.depositTokens('10', '100000000000')).toBe(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should throw error if passed wrong amount', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens(true)).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens('asd')).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens(null)).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens()).rejects.toThrow(TypeError)

      await expect(bee.depositTokens('-1')).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if passed wrong gas price input', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens('1', true)).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens('1', 'asd')).rejects.toThrow(TypeError)
      await expect(bee.depositTokens('1', '-1')).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('retrieveExtendedTag', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.retrieveExtendedTag(0, input as BeeRequestOptions)
    })

    it('should throw exception for bad Tag', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag('')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag(true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag([])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({})).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag(null)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag(undefined)).rejects.toThrow(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({ total: true })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({ total: 'asdf' })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveExtendedTag({ total: null })).rejects.toThrow(TypeError)

      await expect(bee.retrieveExtendedTag(-1)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('getStake', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getStake(input as BeeRequestOptions)
    })
  })

  describe('depositStake', () => {
    const testStakingAmount = '100000000000000000'
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.depositStake(testStakingAmount, undefined, input as BeeRequestOptions)
    })

    testTransactionOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.depositStake(testStakingAmount, input as CashoutOptions)
    })
  })

  describe('createPostageBatch', () => {
    const BATCH_ID = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const BATCH_RESPONSE = {
      batchID: BATCH_ID,
    }

    testPostageBatchOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, input as PostageBatchOptions)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, undefined, input as BeeRequestOptions)
    })

    it('should not pass headers if no gas price is specified', async function () {
      createPostageBatchMock(DEFAULT_BATCH_AMOUNT, '17').reply(201, BATCH_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { waitForUsable: false })).toBe(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async function () {
      createPostageBatchMock(DEFAULT_BATCH_AMOUNT, '17', '100').reply(201, BATCH_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      expect(await bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { waitForUsable: false, gasPrice: '100' })).toBe(
        BATCH_ID,
      )
      assertAllIsDone()
    })

    it('should throw error if passed wrong immutable input', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { immutableFlag: 'asd' })).rejects.toThrow(
        TypeError,
      )

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { immutableFlag: -1 })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 17, { immutableFlag: 'true' })).rejects.toThrow(
        TypeError,
      )
    })

    it('should throw error if too small depth', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, -1)).rejects.toThrow(BeeArgumentError)
      await expect(bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 15)).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if too small amount', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('-10', 17)).rejects.toThrow(BeeArgumentError)
      await expect(bee.createPostageBatch('0', 17)).rejects.toThrow(BeeArgumentError)
      await expect(bee.createPostageBatch('10', 17)).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if too big depth', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch(DEFAULT_BATCH_AMOUNT, 256)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('getPostageBatch', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getPostageBatch(testBatchId, input as BeeRequestOptions)
    })

    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPostageBatch(input as BatchId)
    })
  })

  describe('getPostageBatchBuckets', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getPostageBatchBuckets(testBatchId, input as BeeRequestOptions)
    })

    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPostageBatchBuckets(input as BatchId)
    })
  })
})
