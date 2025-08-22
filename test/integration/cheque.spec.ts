import { Dates, System } from 'cafe-utility'
import { currentBeeMode, makeBee } from '../utils'

const bee = makeBee()

test('GET chequebook status', async () => {
  const chequebookBalance = await bee.getChequebookBalance()
  const chequebookAddress = await bee.getChequebookAddress()
  expect(chequebookBalance.availableBalance.toPLURBigInt()).toBeGreaterThan(0n)
  expect(chequebookBalance.totalBalance.toPLURBigInt()).toBeGreaterThan(0n)
  expect(chequebookAddress.chequebookAddress.toString()).toHaveLength(40)
})

test('GET chequebook/cheque', async () => {
  const { lastcheques } = await bee.getLastCheques()

  // TODO: enable this in light mode once it has cheques
  if (currentBeeMode() !== 'full') {
    return
  }

  expect(lastcheques.some(cheque => cheque.lastsent !== null)).toBeTruthy()
  expect(lastcheques.some(cheque => cheque.lastreceived !== null)).toBeTruthy()

  const cheque = lastcheques[0]
  const peerCheque = await bee.getLastChequesForPeer(cheque.peer)

  expect(peerCheque.lastsent).toStrictEqual(cheque.lastsent)
  expect(peerCheque.lastreceived).toStrictEqual(cheque.lastreceived)

  const cashout = await bee.getLastCashoutAction('8e1198219d746157664463d7c279f88040e97bfbd9940b5a944a768f553afdd1')
  expect(cashout.peer).toBe('8e1198219d746157664463d7c279f88040e97bfbd9940b5a944a768f553afdd1')
  expect(cashout.result?.bounced).toBe(false)
  expect(cashout.lastCashedCheque?.beneficiary.toChecksum()).toBe('0x43E942d82F72ff8185D9fC15024eDE4889c6e2cA')
})

test('deposit/withdraw from chequebook', async () => {
  await bee.depositTokens(1n)
  const transactions = await bee.getAllPendingTransactions()
  expect(transactions.length).toBe(1)
  const transaction = await bee.getPendingTransaction(transactions[0].transactionHash)
  expect(transaction.transactionHash.toHex()).toBe(transactions[0].transactionHash.toHex())

  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.getAllPendingTransactions()

      return pendingTransactions.length === 0
    },
    { attempts: 30, waitMillis: Dates.seconds(1), requiredConsecutivePasses: 3 },
  )

  await bee.withdrawTokens('1')
  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.getAllPendingTransactions()

      return pendingTransactions.length === 0
    },
    { attempts: 30, waitMillis: Dates.seconds(1), requiredConsecutivePasses: 3 },
  )
})
