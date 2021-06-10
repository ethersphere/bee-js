import {
  depositTokens,
  getChequebookAddress,
  getChequebookBalance,
  getLastCheques,
  withdrawTokens,
} from '../../../../src/modules/debug/chequebook'
import { NumberString } from '../../../../src/types'
import { isPrefixedHexString } from '../../../../src/utils/hex'
import { beeDebugUrl, commonMatchers, sleep } from '../../../utils'

if (process.env.BEE_TEST_CHEQUEBOOK) {
  commonMatchers()

  describe('swap enabled chequebook', () => {
    test('address', async () => {
      const response = await getChequebookAddress(beeDebugUrl())

      expect(isPrefixedHexString(response.chequebookAddress)).toBeTruthy()
    })

    test('balance', async () => {
      const response = await getChequebookBalance(beeDebugUrl())

      expect(response.availableBalance).toBeNumberString()
      expect(response.totalBalance).toBeNumberString()
    })

    const TRANSACTION_TIMEOUT = 20 * 1000

    const withDrawDepositTest = (amount: number | NumberString) => async () => {
      const withdrawResponse = await withdrawTokens(beeDebugUrl(), amount)
      expect(withdrawResponse).toBeType('string')

      // TODO avoid sleep in tests
      // See https://github.com/ethersphere/bee/issues/1191
      await sleep(TRANSACTION_TIMEOUT)

      const depositResponse = await depositTokens(beeDebugUrl(), amount)

      expect(depositResponse).toBeType('string')

      // TODO avoid sleep in tests
      // See https://github.com/ethersphere/bee/issues/1191
      await sleep(TRANSACTION_TIMEOUT)
    }

    test('withdraw and deposit string', async () => await withDrawDepositTest('5'), 3 * TRANSACTION_TIMEOUT)
    test('withdraw and deposit integer', async () => await withDrawDepositTest(5), 3 * TRANSACTION_TIMEOUT)

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
