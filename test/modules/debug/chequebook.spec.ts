import {
  depositTokens,
  getChequebookAddress,
  getChequeubookBalance,
  getLastCheques,
  withdrawTokens,
} from '../../../src/modules/debug/chequebook'
import { isHexString } from '../../../src/utils/hex'
import { beeChequebookUrl, sleep } from '../../utils'

const url = beeChequebookUrl()

if (url) {
  describe('swap enabled chequebook', () => {
    test('address', async () => {
      const response = await getChequebookAddress(url)

      expect(isHexString(response.chequebookaddress)).toBeTruthy()
    })

    test('balance', async () => {
      const response = await getChequeubookBalance(url)

      expect(typeof response.availableBalance).toBe('number')
      expect(typeof response.totalBalance).toBe('number')
    })

    const TRANSACTION_TIMEOUT = 20 * 1000

    test(
      'withdraw and deposit',
      async () => {
        const withdrawResponse = await withdrawTokens(url, 10)
        expect(typeof withdrawResponse.transactionHash).toBe('string')

        // TODO avoid sleep in tests
        await sleep(TRANSACTION_TIMEOUT)

        const depositResponse = await depositTokens(url, 10)

        expect(typeof depositResponse.transactionHash).toBe('string')
      },
      2 * TRANSACTION_TIMEOUT,
    )

    test('get last cheques for all peers', async () => {
      const response = await getLastCheques(url)

      expect(Array.isArray(response.lastcheques)).toBeTruthy()
    })
  })
} else {
  test('swap disabled chequebook')
}
