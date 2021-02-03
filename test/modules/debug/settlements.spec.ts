import * as connectivity from '../../../src/modules/debug/connectivity'
import * as settlements from '../../../src/modules/debug/settlements'
import { beeDebugUrl, beePeerUrl } from '../../utils'

// helper function to get the peer overlay address
async function getPeerOverlay() {
  const nodeAddresses = await connectivity.getNodeAddresses(beeDebugUrl(beePeerUrl()))

  return nodeAddresses.overlay
}

describe('settlements', () => {
  test('peer settlements', async () => {
    const peer = await getPeerOverlay()
    const response = await settlements.getSettlements(beeDebugUrl(), peer)

    expect(response.peer).toEqual(peer)
    expect(typeof response.received).toBe('number')
    expect(typeof response.sent).toBe('number')
  })

  test('all settlements', async () => {
    const response = await settlements.getAllSettlements(beeDebugUrl())

    expect(Array.isArray(response.settlements)).toBeTruthy()
    expect(typeof response.totalreceived).toBe('number')
    expect(typeof response.totalsent).toBe('number')
  })
})
