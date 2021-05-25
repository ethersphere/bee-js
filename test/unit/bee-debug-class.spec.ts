import { assertAllIsDone, cashoutLastChequeMock, MOCK_SERVER_URL } from './nock'
import { BeeArgumentError, BeeDebug } from '../../src'
import { testAddress } from '../utils'

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

  describe('cashoutLastCheque', () => {
    const TRANSACTION_HASH = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const CASHOUT_RESPONSE = {
      transactionHash: TRANSACTION_HASH,
    }

    it('should not pass headers if no gas price is specified', async () => {
      cashoutLastChequeMock(testAddress).reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress)).resolves.toEqual(CASHOUT_RESPONSE)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      cashoutLastChequeMock(testAddress, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: BigInt('100000000000') })).resolves.toEqual(
        CASHOUT_RESPONSE,
      )
      assertAllIsDone()
    })

    it('should pass headers if gas limit is specified', async () => {
      cashoutLastChequeMock(testAddress, undefined, '100000000000').reply(201, CASHOUT_RESPONSE)

      const bee = new BeeDebug(MOCK_SERVER_URL)
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: BigInt('100000000000') })).resolves.toEqual(
        CASHOUT_RESPONSE,
      )
      assertAllIsDone()
    })

    it('should throw error if passed wrong address', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(true)).rejects.toThrow(TypeError)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(11)).rejects.toThrow(TypeError)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(null)).rejects.toThrow(TypeError)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque()).rejects.toThrow(TypeError)

      await expect(bee.cashoutLastCheque('')).rejects.toThrow(TypeError)
      await expect(bee.cashoutLastCheque('asd')).rejects.toThrow(TypeError)
    })

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: 'asd' })).rejects.toThrow(TypeError)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: true })).rejects.toThrow(TypeError)
      await expect(bee.cashoutLastCheque(testAddress, { gasPrice: BigInt('-1') })).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if passed wrong gas limit input', async () => {
      const bee = new BeeDebug(MOCK_SERVER_URL)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: 'asd' })).rejects.toThrow(TypeError)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: true })).rejects.toThrow(TypeError)
      await expect(bee.cashoutLastCheque(testAddress, { gasLimit: BigInt('-1') })).rejects.toThrow(BeeArgumentError)
    })
  })
})
