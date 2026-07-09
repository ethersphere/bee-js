import { Dates, System } from 'cafe-utility'
import { Bee } from '../../src'
import { makeBee } from '../utils'

const bee = makeBee()
const issuer = new Bee('http://localhost:1635')
const receiver = new Bee('http://localhost:1637')

test('GET chequebook status', async () => {
  const chequebookBalance = await bee.getChequebookBalance()
  const chequebookAddress = await bee.getChequebookAddress()
  expect(chequebookBalance.availableBalance.toPLURBigInt()).toBeGreaterThan(0n)
  expect(chequebookBalance.totalBalance.toPLURBigInt()).toBeGreaterThan(0n)
  expect(chequebookAddress.chequebookAddress.toString()).toHaveLength(40)
})

test('GET chequebook/cheque (issuer)', async () => {
  const { lastcheques } = await issuer.getLastCheques()

  const sentCheques = lastcheques.filter(cheque => cheque.lastsent !== null)
  expect(sentCheques.length).toBeGreaterThan(0)

  const cheque = sentCheques[0]
  const peerCheque = await issuer.getLastChequesForPeer(cheque.peer)

  expect(peerCheque.lastsent).toStrictEqual(cheque.lastsent)
})

test('GET chequebook/cheque (receiver)', async () => {
  const { lastcheques } = await receiver.getLastCheques()

  const receivedCheques = lastcheques.filter(cheque => cheque.lastreceived !== null)
  expect(receivedCheques.length).toBeGreaterThan(0)

  const cheque = receivedCheques[0]
  const peerCheque = await receiver.getLastChequesForPeer(cheque.peer)

  expect(peerCheque.lastreceived).toStrictEqual(cheque.lastreceived)

  await receiver.cashoutLastCheque(cheque.peer)

  await System.waitFor(
    async () => {
      const pendingTransactions = await receiver.transaction.getAll()

      return pendingTransactions.length === 0
    },
    { attempts: 30, waitMillis: Dates.seconds(1), requiredConsecutivePasses: 3 },
  )

  const cashout = await receiver.getLastCashoutAction(cheque.peer)
  expect(cashout.peer).toBe(cheque.peer)
  expect(cashout.result?.bounced).toBe(false)
})

test('deposit/withdraw from chequebook', async () => {
  await bee.depositTokens(1n)
  const transactions = await bee.transaction.getAll()
  expect(transactions.length).toBe(1)
  const transaction = await bee.transaction.get(transactions[0].transactionHash)
  expect(transaction.transactionHash.toHex()).toBe(transactions[0].transactionHash.toHex())

  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.transaction.getAll()

      return pendingTransactions.length === 0
    },
    { attempts: 30, waitMillis: Dates.seconds(1), requiredConsecutivePasses: 3 },
  )

  await bee.withdrawTokens('1')
  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.transaction.getAll()

      return pendingTransactions.length === 0
    },
    { attempts: 30, waitMillis: Dates.seconds(1), requiredConsecutivePasses: 3 },
  )
})
