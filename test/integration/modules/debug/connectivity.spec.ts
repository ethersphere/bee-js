import {
  getBlocklist,
  getNodeAddresses,
  getPeers,
  getTopology,
  pingPeer,
} from '../../../../src/modules/debug/connectivity'
import { beeKyOptions } from '../../../utils'

describe('modules/debug/connectivity', () => {
  it('getPeers', async function () {
    const peers = await getPeers(beeKyOptions())

    expect(Array.isArray(peers)).toBeTruthy()
    expect(peers.length).toBeGreaterThan(0)

    peers.forEach(peer => {
      expect(peer).toHaveProperty('address')
      expect(peer.address).toMatch(/^[0-9a-f]{64}$/i)
    })
  })

  it('getBlocklist', async function () {
    const peers = await getBlocklist(beeKyOptions())

    expect(Array.isArray(peers)).toBeTruthy()

    peers.forEach(peer => {
      expect(peer).toHaveProperty('address')
      expect(peer.address).toMatch(/^[0-9a-f]{64}$/i)
    })
  })

  it('getTopology', async function () {
    const topology = await getTopology(beeKyOptions())

    expect(topology.baseAddr).toMatch(/^[0-9a-f]{64}$/i)
    expect(topology.population).toBeGreaterThanOrEqual(0)
    expect(topology.connected).toBeGreaterThanOrEqual(0)
    expect(!isNaN(Date.parse(topology.timestamp))).toBeTruthy()
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

  it('getNodeAddresses', async function () {
    const addresses = await getNodeAddresses(beeKyOptions())

    expect(addresses.overlay).toMatch(/^[0-9a-f]{64}$/)
    expect(Array.isArray(addresses.underlay)).toBeTruthy()
    expect(addresses.ethereum).toMatch(/^0x[0-9a-f]{40}$/)
    expect(addresses.publicKey).toMatch(/^[0-9a-f]{66}$/)
    expect(addresses.pssPublicKey).toMatch(/^[0-9a-f]{66}$/)
  })

  it('pingPeer', async function () {
    const peers = await getPeers(beeKyOptions())
    const res = await pingPeer(beeKyOptions(), peers[0].address)

    expect(res.rtt).toMatch(/^\d+(\.\d+)?[mnpµ]?s$/)
  })
})
