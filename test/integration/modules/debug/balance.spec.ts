import { beeDebugUrl, beePeerDebugUrl } from '../../../utils'
import * as balance from '../../../../src/modules/debug/balance'
import * as connectivity from '../../../../src/modules/debug/connectivity'

// helper function to get the peer overlay address
async function getPeerOverlay() {
  const nodeAddresses = await connectivity.getNodeAddresses(beePeerDebugUrl())

  return nodeAddresses.overlay
}

describe('balance', () => {
  describe('balances', () => {
    test('Get the balances with all known peers including prepaid services', async () => {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getAllBalances(beeDebugUrl())

      expect(response.balances).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            balance: expect.any(BigInt),
          }),
        ]),
      )

      const peerBalances = response.balances.map(peerBalance => peerBalance.peer)

      expect(peerBalances.includes(peerOverlay)).toBeTruthy()
    })

    test('Get the balances with all known peers including prepaid services', async () => {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPeerBalance(beeDebugUrl(), peerOverlay)

      expect(peerBalance.peer).toEqual(peerOverlay)
      expect(typeof peerBalance.balance).toBe('bigint')
    })
  })

  describe('consumed', () => {
    test('Get the past due consumption balances with all known peers', async () => {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getPastDueConsumptionBalances(beeDebugUrl())

      expect(response.balances).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            balance: expect.any(BigInt),
          }),
        ]),
      )

      const peerBalances = response.balances.map(peerBalance => peerBalance.peer)

      expect(peerBalances.includes(peerOverlay)).toBeTruthy()
    })

    test('Get the past due consumption balance with a specific peer', async () => {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPastDueConsumptionPeerBalance(beeDebugUrl(), peerOverlay)

      expect(peerBalance.peer).toEqual(peerOverlay)
      expect(typeof peerBalance.balance).toBe('bigint')
    })
  })
})
