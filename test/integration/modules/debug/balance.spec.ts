import { beeDebugKyOptions, beePeerDebugKyOptions, commonMatchers } from '../../../utils'
import * as balance from '../../../../src/modules/debug/balance'
import * as connectivity from '../../../../src/modules/debug/connectivity'

// helper function to get the peer overlay address
async function getPeerOverlay() {
  const nodeAddresses = await connectivity.getNodeAddresses(beePeerDebugKyOptions())

  return nodeAddresses.overlay
}

commonMatchers()

describe('balance', () => {
  describe('balances', () => {
    test('Get the balances with all known peers including prepaid services', async () => {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getAllBalances(beeDebugKyOptions())

      expect(response.balances).to.equal(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            balance: expect.any(String),
          }),
        ]),
      )

      const peerBalances = response.balances.map(peerBalance => peerBalance.peer)

      expect(peerBalances.includes(peerOverlay)).toBeTruthy()
    })

    test('Get the balances with all known peers including prepaid services', async () => {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPeerBalance(beeDebugKyOptions(), peerOverlay)

      expect(peerBalance.peer).to.equal(peerOverlay)
      expect(peerBalance.balance).toBeNumberString()
    })
  })

  describe('consumed', () => {
    test('Get the past due consumption balances with all known peers', async () => {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getPastDueConsumptionBalances(beeDebugKyOptions())

      expect(response.balances).to.equal(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            balance: expect.any(String),
          }),
        ]),
      )

      const peerBalances = response.balances.map(peerBalance => peerBalance.peer)

      expect(peerBalances.includes(peerOverlay)).toBeTruthy()
    })

    test('Get the past due consumption balance with a specific peer', async () => {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPastDueConsumptionPeerBalance(beeDebugKyOptions(), peerOverlay)

      expect(peerBalance.peer).to.equal(peerOverlay)
      expect(peerBalance.balance).toBeNumberString()
    })
  })
})
