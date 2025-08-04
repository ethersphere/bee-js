import { Dates, System, Types } from 'cafe-utility'
import { makeBee } from '../utils'

const bee = makeBee()

test('withdraw to external wallet', async () => {
  const walletBefore = await bee.getWalletBalance()

  await bee.withdrawBZZToExternalWallet('1', Types.asString(process.env.JEST_WITHDRAW_ADDRESS))
  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.getAllPendingTransactions()

      return pendingTransactions.length === 0
    },
    Dates.seconds(1),
    60,
  )

  await bee.withdrawDAIToExternalWallet('1', Types.asString(process.env.JEST_WITHDRAW_ADDRESS))
  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.getAllPendingTransactions()

      return pendingTransactions.length === 0
    },
    Dates.seconds(1),
    60,
  )

  const walletAfter = await bee.getWalletBalance()

  expect(walletAfter.bzzBalance.toPLURBigInt()).toBeLessThan(walletBefore.bzzBalance.toPLURBigInt())
  expect(walletAfter.nativeTokenBalance.toWeiBigInt()).toBeLessThan(walletBefore.nativeTokenBalance.toWeiBigInt())
})
