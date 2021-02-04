import {
  depositTokens,
  getChequebookAddress,
  getChequeubookBalance,
  getLastCheques,
  withdrawTokens,
} from '../../../src/modules/debug/chequebook'
import { isHexString } from '../../../src/utils/hex'
import { beeDebugUrl, sleep } from '../../utils'

if (process.env.BEE_TEST_CHEQUEBOOK) {
  describe('swap enabled chequebook', () => {
    test('address', async () => {
      const response = await getChequebookAddress(beeDebugUrl())

      expect(isHexString(response.chequebookaddress)).toBeTruthy()
    })

    test('balance', async () => {
      const response = await getChequeubookBalance(beeDebugUrl())

      expect(typeof response.availableBalance).toBe('number')
      expect(typeof response.totalBalance).toBe('number')
    })

    const TRANSACTION_TIMEOUT = 20 * 1000

    test(
      'withdraw and deposit',
      async () => {
        const withdrawResponse = await withdrawTokens(beeDebugUrl(), 10)
        expect(typeof withdrawResponse.transactionHash).toBe('string')

        // TODO avoid sleep in tests
        // See https://github.com/ethersphere/bee/issues/1191
        await sleep(TRANSACTION_TIMEOUT)

        const depositResponse = await depositTokens(beeDebugUrl(), 10)

        expect(typeof depositResponse.transactionHash).toBe('string')
      },
      2 * TRANSACTION_TIMEOUT,
    )

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
