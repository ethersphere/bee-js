import {
  depositTokens,
  getChequebookAddress,
  getChequebookBalance,
  getLastCheques,
  withdrawTokens,
} from '../../../src/modules/debug/chequebook'
import { isPrefixedHexString } from '../../../src/utils/hex'
import { beeDebugUrl, sleep } from '../../utils'

if (process.env.BEE_TEST_CHEQUEBOOK) {
  describe('swap enabled chequebook', () => {
    test('address', async () => {
      const response = await getChequebookAddress(beeDebugUrl())

      expect(isPrefixedHexString(response.chequebookaddress)).toBeTruthy()
    })

    test('balance', async () => {
      const response = await getChequebookBalance(beeDebugUrl())

      expect(typeof response.availableBalance).toBe('number')
      expect(typeof response.totalBalance).toBe('number')
    })

    const TRANSACTION_TIMEOUT = 20 * 1000

    const withDrawDepositTest = (amount: number | BigInt) => async () => {
      const withdrawResponse = await withdrawTokens(beeDebugUrl(), amount)
      expect(typeof withdrawResponse.transactionHash).toBe('string')

      // TODO avoid sleep in tests
      // See https://github.com/ethersphere/bee/issues/1191
      await sleep(TRANSACTION_TIMEOUT)

      const depositResponse = await depositTokens(beeDebugUrl(), amount)

      expect(typeof depositResponse.transactionHash).toBe('string')
    }

    test('withdraw and deposit integer', withDrawDepositTest(10), 2 * TRANSACTION_TIMEOUT)
    test('withdraw and deposit BigInt', withDrawDepositTest(BigInt(10)), 2 * TRANSACTION_TIMEOUT)

    test('get last cheques for all peers', async () => {
      const response = await getLastCheques(beeDebugUrl())

      expect(Array.isArray(response.lastcheques)).toBeTruthy()
    })
  })
} else {
  test('swap disabled chequebook', () => {
    // eslint-disable-next-line no-console
    console.log(`
      Chequebook tests are disabled because BEE_TEST_CHEQUEBOOK environment variable is not set.
    `)
  })
}
