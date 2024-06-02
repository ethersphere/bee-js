import { System } from 'cafe-utility'
import { expect } from 'chai'
import {
  depositTokens,
  getChequebookAddress,
  getChequebookBalance,
  getLastCheques,
  withdrawTokens,
} from '../../../../src/modules/debug/chequebook'
import { NumberString } from '../../../../src/types'
import { isPrefixedHexString } from '../../../../src/utils/hex'
import { beeKyOptions, commonMatchers } from '../../../utils'

if (process.env.BEE_TEST_CHEQUEBOOK) {
  commonMatchers()

  describe('swap enabled chequebook', () => {
    it('address', async function () {
      const response = await getChequebookAddress(beeKyOptions())

      expect(isPrefixedHexString(response.chequebookAddress)).to.be.ok()
    })

    it('balance', async function () {
      const response = await getChequebookBalance(beeKyOptions())

      expect(response.availableBalance).to.be.numberString()
      expect(response.totalBalance).to.be.numberString()
    })

    const TRANSACTION_TIMEOUT = 20 * 1000

    const withDrawDepositTest = (amount: number | NumberString) => async () => {
      const withdrawResponse = await withdrawTokens(beeKyOptions(), amount)
      expect(withdrawResponse).a('string')

      // TODO avoid sleep in tests
      // See https://github.com/ethersphere/bee/issues/1191
      await System.sleepMillis(TRANSACTION_TIMEOUT)

      const depositResponse = await depositTokens(beeKyOptions(), amount)

      expect(depositResponse).a('string')

      // TODO avoid sleep in tests
      // See https://github.com/ethersphere/bee/issues/1191
      await System.sleepMillis(TRANSACTION_TIMEOUT)
    }

    it('withdraw and deposit string', async function () {
      this.timeout(3 * TRANSACTION_TIMEOUT)
      await withDrawDepositTest('5')
    })

    it('withdraw and deposit integer', async function () {
      this.timeout(3 * TRANSACTION_TIMEOUT)
      await withDrawDepositTest(5)
    })

    it('get last cheques for all peers', async function () {
      const response = await getLastCheques(beeKyOptions())

      expect(Array.isArray(response.lastcheques)).to.be.ok()
    })
  })
} else {
  it('swap disabled chequebook', () => {
    // eslint-disable-next-line no-console
    console.log(`
      Chequebook tests are disabled because BEE_TEST_CHEQUEBOOK environment variable is not set.
    `)
  })
}
