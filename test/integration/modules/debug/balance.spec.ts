import * as balance from '../../../../src/modules/debug/balance'
import * as connectivity from '../../../../src/modules/debug/connectivity'
import { beeKyOptions, beePeerKyOptions, commonMatchers } from '../../../utils'

// helper function to get the peer overlay address
async function getPeerOverlay() {
  const nodeAddresses = await connectivity.getNodeAddresses(beePeerKyOptions())

  return nodeAddresses.overlay
}

commonMatchers()

describe('balance', () => {
  describe('balances', () => {
    it('Get the balances with all known peers including prepaid services', async function () {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getAllBalances(beeKyOptions())

      expect(response.balances).toEqual(
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

    it('Get the balances with all known peers including prepaid services', async function () {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPeerBalance(beeKyOptions(), peerOverlay)

      expect(peerBalance.peer).toBe(peerOverlay)
      expect(peerBalance.balance).toBeNumberString()
    })
  })

  describe('consumed', () => {
    it('Get the past due consumption balances with all known peers', async function () {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getPastDueConsumptionBalances(beeKyOptions())

      expect(response.balances).toEqual(
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

    it('Get the past due consumption balance with a specific peer', async function () {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPastDueConsumptionPeerBalance(beeKyOptions(), peerOverlay)

      expect(peerBalance.peer).toBe(peerOverlay)
      expect(peerBalance.balance).toBeNumberString()
    })
  })
})
