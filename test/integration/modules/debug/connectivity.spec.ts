import {
  getPeers,
  getBlocklist,
  getTopology,
  getNodeAddresses,
  pingPeer,
} from '../../../../src/modules/debug/connectivity'
import { beeDebugKyOptions } from '../../../utils'
import { expect } from 'chai'

describe('modules/debug/connectivity', () => {
  it('getPeers', async function () {
    const peers = await getPeers(beeDebugKyOptions())

    expect(Array.isArray(peers)).to.be.ok()
    expect(peers.length).above(0)

    peers.forEach(peer => {
      expect(peer).to.have.property('address')
      expect(peer.address).to.match(/^[0-9a-f]{64}$/i)
    })
  })

  it('getBlocklist', async function () {
    const peers = await getBlocklist(beeDebugKyOptions())

    expect(Array.isArray(peers)).to.be.ok()

    peers.forEach(peer => {
      expect(peer).to.have.property('address')
      expect(peer.address).to.match(/^[0-9a-f]{64}$/i)
    })
  })

  it('getTopology', async function () {
    const topology = await getTopology(beeDebugKyOptions())

    expect(topology.baseAddr).to.match(/^[0-9a-f]{64}$/i)
    expect(topology.population).to.be.least(0)
    expect(topology.connected).to.be.least(0)
    expect(!isNaN(Date.parse(topology.timestamp))).to.be.ok()
    expect(topology.nnLowWatermark).to.be.least(0)
    expect(topology.depth).to.be.least(0)

    for (let i = 0; i < 16; ++i) {
      const bin = topology.bins[`bin_${i}` as keyof typeof topology.bins]
      expect(bin.population).to.be.least(0)
      expect(bin.connected).to.be.least(0)
      expect(Array.isArray(bin.disconnectedPeers) || bin.disconnectedPeers === null).to.be.ok()
      expect(Array.isArray(bin.connectedPeers) || bin.connectedPeers === null).to.be.ok()
    }
  })

  it('getNodeAddresses', async function () {
    const addresses = await getNodeAddresses(beeDebugKyOptions())

    expect(addresses.overlay).to.match(/^[0-9a-f]{64}$/)
    expect(Array.isArray(addresses.underlay)).to.be.ok()
    expect(addresses.ethereum).to.match(/^0x[0-9a-f]{40}$/)
    expect(addresses.publicKey).to.match(/^[0-9a-f]{66}$/)
    expect(addresses.pssPublicKey).to.match(/^[0-9a-f]{66}$/)
  })

  it('pingPeer', async function () {
    const peers = await getPeers(beeDebugKyOptions())
    const res = await pingPeer(beeDebugKyOptions(), peers[0].address)

    expect(res.rtt).to.match(/^\d+(\.\d+)?[mnpµ]?s$/)
  })
})
