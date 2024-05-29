import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
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

      jestExpect(response.balances).toEqual(
        jestExpect.arrayContaining([
          jestExpect.objectContaining({
            peer: jestExpect.any(String),
            balance: jestExpect.any(String),
          }),
        ]),
      )

      const peerBalances = response.balances.map(peerBalance => peerBalance.peer)

      expect(peerBalances.includes(peerOverlay)).to.be.ok()
    })

    it('Get the balances with all known peers including prepaid services', async function () {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPeerBalance(beeKyOptions(), peerOverlay)

      expect(peerBalance.peer).to.eql(peerOverlay)
      expect(peerBalance.balance).to.be.numberString()
    })
  })

  describe('consumed', () => {
    it('Get the past due consumption balances with all known peers', async function () {
      const peerOverlay = await getPeerOverlay()
      const response = await balance.getPastDueConsumptionBalances(beeKyOptions())

      jestExpect(response.balances).toEqual(
        jestExpect.arrayContaining([
          jestExpect.objectContaining({
            peer: jestExpect.any(String),
            balance: jestExpect.any(String),
          }),
        ]),
      )

      const peerBalances = response.balances.map(peerBalance => peerBalance.peer)

      expect(peerBalances.includes(peerOverlay)).to.be.ok()
    })

    it('Get the past due consumption balance with a specific peer', async function () {
      const peerOverlay = await getPeerOverlay()
      const peerBalance = await balance.getPastDueConsumptionPeerBalance(beeKyOptions(), peerOverlay)

      expect(peerBalance.peer).to.eql(peerOverlay)
      expect(peerBalance.balance).to.be.numberString()
    })
  })
})
