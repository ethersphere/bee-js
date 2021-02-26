import { getPeers } from '../../../src/modules/debug/connectivity'
import { beeDebugUrl } from '../../utils'

describe('getPeers', () => {
  test('address', async () => {
    const { peers } = await getPeers(beeDebugUrl())

    expect(Array.isArray(peers)).toBeTruthy()
    expect(peers.length).toBeGreaterThan(0)

    peers.forEach(peer => {
      expect(peer).toHaveProperty('address')
      expect(peer.address).toMatch(/^[0-9a-f]{64}$/i)
    })
  })
})
