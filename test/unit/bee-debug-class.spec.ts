import {
  assertAllIsDone,
  cashoutLastChequeMock,
  createPostageBatchMock,
  depositTokensMock,
  MOCK_SERVER_URL,
  withdrawTokensMock,
} from './nock'
import { BatchId, BeeArgumentError, BeeDebug } from '../../src'
import { testAddress } from '../utils'
import { testAddressAssertions, testBatchIdAssertion } from './assertions'

describe('BeeDebug class', () => {
  function testUrl(url: unknown): void {
    it(`should not accept invalid url '${url}'`, () => {
      try {
        new BeeDebug(url as string)
        fail('BeeDebug constructor should have thrown error.')
      } catch (e) {
        if (e instanceof BeeArgumentError) {
          expect(e.value).toEqual(url)

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

  describe('removePeer', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.removePeer(input as string)
    })
  })

  describe('pingPeer', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.pingPeer(input as string)
    })
  })

  describe('getPeerBalance', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPeerBalance(input as string)
    })
  })

  describe('getPastDueConsumptionPeerBalance', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPastDueConsumptionPeerBalance(input as string)
    })
  })

  describe('getLastChequesForPeer', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getLastChequesForPeer(input as string)
    })
  })

  describe('getLastCashoutAction', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getLastCashoutAction(input as string)
    })
  })

  describe('getSettlements', () => {
    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getSettlements(input as string)
    })
  })

  describe('cashoutLastCheque', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    it('should not pass headers if no gas price is specified', async () => {
      cashoutLastChequeMock(testAddress).reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress)).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      cashoutLastChequeMock(testAddress, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: '100000000000' })).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas limit is specified', async () => {
      cashoutLastChequeMock(testAddress, undefined, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: '100000000000' })).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    testAddressAssertions(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.cashoutLastCheque(input as string)
    })

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: true })).rejects.toThrow(TypeError)
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: '-1' })).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if passed wrong gas limit input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: true })).rejects.toThrow(TypeError)
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: '-1' })).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('withdrawTokens', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    it('should not pass headers if no gas price is specified', async () => {
      withdrawTokensMock('10').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.withdrawTokens('10')).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      withdrawTokensMock('10', '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.withdrawTokens('10', '100000000000')).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should throw error if passed wrong amount', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

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

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

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

    it('should not pass headers if no gas price is specified', async () => {
      depositTokensMock('10').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.depositTokens('10')).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      depositTokensMock('10', '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.depositTokens('10', '100000000000')).resolves.toEqual(TRANSACTION_HASH)
      assertAllIsDone()
    })

    it('should throw error if passed wrong amount', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

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

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.depositTokens('1', true)).rejects.toThrow(TypeError)
      // @ts-ignore: Input testing
      await expect(bee.depositTokens('1', 'asd')).rejects.toThrow(TypeError)
      await expect(bee.depositTokens('1', '-1')).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('retrieveExtendedTag', () => {
    it('should throw exception for bad Tag', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

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

  describe('createPostageBatch', () => {
    const BATCH_ID = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const BATCH_RESPONSE = {
      batchID: BATCH_ID,
    }

    it('should not pass headers if no gas price is specified', async () => {
      createPostageBatchMock('10', '17').reply(201, BATCH_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17)).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      createPostageBatchMock('10', '17', '100').reply(201, BATCH_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17, { gasPrice: '100' })).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if immutable flag is specified', async () => {
      createPostageBatchMock('10', '17', undefined, undefined, 'true').reply(201, BATCH_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: true })).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { gasPrice: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { gasPrice: true })).rejects.toThrow(TypeError)
      await expect(bee.createPostageBatch('10', 17, { gasPrice: '-1' })).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if passed wrong immutable input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: -1 })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: 'true' })).rejects.toThrow(TypeError)
    })

    it('should throw error if too small depth', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('10', -1)).rejects.toThrow(BeeArgumentError)
      await expect(bee.createPostageBatch('10', 15)).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if too big depth', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('10', 256)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('getPostageBatch', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPostageBatch(input as BatchId)
    })
  })

  describe('getPostageBatchBuckets', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      return bee.getPostageBatchBuckets(input as BatchId)
    })
  })
})
