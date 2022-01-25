import {
  getPeers,
  getBlocklist,
  getTopology,
  getNodeAddresses,
  pingPeer,
} from '../../../../src/modules/debug/connectivity'
import { beeDebugKy } from '../../../utils'

describe('modules/debug/connectivity', () => {
  test('getPeers', async () => {
    const peers = await getPeers(beeDebugKy())

    expect(Array.isArray(peers)).toBeTruthy()
    expect(peers.length).toBeGreaterThan(0)

    peers.forEach(peer => {
      expect(peer).toHaveProperty('address')
      expect(peer.address).toMatch(/^[0-9a-f]{64}$/i)
    })
  })

  test('getBlocklist', async () => {
    const peers = await getBlocklist(beeDebugKy())

    expect(Array.isArray(peers)).toBeTruthy()

    peers.forEach(peer => {
      expect(peer).toHaveProperty('address')
      expect(peer.address).toMatch(/^[0-9a-f]{64}$/i)
    })
  })

  test('getTopology', async () => {
    const topology = await getTopology(beeDebugKy())

    expect(topology.baseAddr).toMatch(/^[0-9a-f]{64}$/i)
    expect(topology.population).toBeGreaterThanOrEqual(0)
    expect(topology.connected).toBeGreaterThanOrEqual(0)
    expect(Date.parse(topology.timestamp) !== NaN).toBeTruthy()
    expect(topology.nnLowWatermark).toBeGreaterThanOrEqual(0)
    expect(topology.depth).toBeGreaterThanOrEqual(0)

    for (let i = 0; i < 16; ++i) {
      const bin = topology.bins[`bin_${i}` as keyof typeof topology.bins]
      expect(bin.population).toBeGreaterThanOrEqual(0)
      expect(bin.connected).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(bin.disconnectedPeers) || bin.disconnectedPeers === null).toBeTruthy()
      expect(Array.isArray(bin.connectedPeers) || bin.connectedPeers === null).toBeTruthy()
    }
  })

  test('getNodeAddresses', async () => {
    const addresses = await getNodeAddresses(beeDebugKy())

    expect(addresses.overlay).toMatch(/^[0-9a-f]{64}$/)
    expect(Array.isArray(addresses.underlay)).toBeTruthy()
    expect(addresses.ethereum).toMatch(/^0x[0-9a-f]{40}$/)
    expect(addresses.publicKey).toMatch(/^[0-9a-f]{66}$/)
    expect(addresses.pssPublicKey).toMatch(/^[0-9a-f]{66}$/)
  })

  test('pingPeer', async () => {
    const peers = await getPeers(beeDebugKy())
    const res = await pingPeer(beeDebugKy(), peers[0].address)

    expect(res.rtt).toMatch(/^\d+(\.\d+)?[mnpµ]?s$/)
  })
})
