import { Types } from 'cafe-utility'
import type {
  BeeRequestOptions,
  Bin,
  NodeAddresses,
  Peer,
  PingResponse,
  RemovePeerResponse,
  Topology,
} from '../../types'
import { http } from '../../utils/http'
import { EthAddress, PeerAddress, PublicKey } from '../../utils/typed-bytes'

export async function getNodeAddresses(requestOptions: BeeRequestOptions): Promise<NodeAddresses> {
  const response = await http<unknown>(requestOptions, {
    url: 'addresses',
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    overlay: Types.asString(body.overlay, { name: 'overlay' }),
    underlay: Types.asArray(body.underlay, { name: 'underlay' }).map(x => Types.asString(x, { name: 'underlay' })),
    ethereum: new EthAddress(Types.asString(body.ethereum, { name: 'ethereum' })),
    publicKey: new PublicKey(Types.asString(body.publicKey, { name: 'publicKey' })),
    pssPublicKey: new PublicKey(Types.asString(body.pssPublicKey, { name: 'pssPublicKey' })),
  }
}

interface Peers {
  peers: Peer[]
}

export async function getPeers(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<unknown>(requestOptions, {
    url: 'peers',
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return Types.asArray(body.peers, { name: 'peers' }).map(x => ({
    address: Types.asString(Types.asObject(x, { name: 'peer' }).address, { name: 'address' }),
    fullNode: Types.asBoolean(Types.asObject(x, { name: 'peer' }).fullNode, { name: 'fullNode' }),
  }))
}

export async function getBlocklist(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<Peers>(requestOptions, {
    url: 'blocklist',
    responseType: 'json',
  })

  return response.data.peers
}

export async function removePeer(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<RemovePeerResponse> {
  const response = await http<RemovePeerResponse>(requestOptions, {
    url: `peers/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.data
}

export async function getTopology(requestOptions: BeeRequestOptions): Promise<Topology> {
  const response = await http<unknown>(requestOptions, {
    url: `topology`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const bins = Types.asObject(body.bins, { name: 'bins' })

  return {
    baseAddr: Types.asString(body.baseAddr, { name: 'baseAddr' }),
    population: Types.asNumber(body.population, { name: 'population' }),
    connected: Types.asNumber(body.connected, { name: 'connected' }),
    timestamp: Types.asString(body.timestamp, { name: 'timestamp' }),
    nnLowWatermark: Types.asNumber(body.nnLowWatermark, { name: 'nnLowWatermark' }),
    depth: Types.asNumber(body.depth, { name: 'depth' }),
    reachability: Types.asString(body.reachability, { name: 'reachability' }),
    networkAvailability: Types.asString(body.networkAvailability, { name: 'networkAvailability' }),
    bins: {
      bin_0: asBin(bins.bin_0, 'bin_0'),
      bin_1: asBin(bins.bin_1, 'bin_1'),
      bin_2: asBin(bins.bin_2, 'bin_2'),
      bin_3: asBin(bins.bin_3, 'bin_3'),
      bin_4: asBin(bins.bin_4, 'bin_4'),
      bin_5: asBin(bins.bin_5, 'bin_5'),
      bin_6: asBin(bins.bin_6, 'bin_6'),
      bin_7: asBin(bins.bin_7, 'bin_7'),
      bin_8: asBin(bins.bin_8, 'bin_8'),
      bin_9: asBin(bins.bin_9, 'bin_9'),
      bin_10: asBin(bins.bin_10, 'bin_10'),
      bin_11: asBin(bins.bin_11, 'bin_11'),
      bin_12: asBin(bins.bin_12, 'bin_12'),
      bin_13: asBin(bins.bin_13, 'bin_13'),
      bin_14: asBin(bins.bin_14, 'bin_14'),
      bin_15: asBin(bins.bin_15, 'bin_15'),
      bin_16: asBin(bins.bin_16, 'bin_16'),
      bin_17: asBin(bins.bin_17, 'bin_17'),
      bin_18: asBin(bins.bin_18, 'bin_18'),
      bin_19: asBin(bins.bin_19, 'bin_19'),
      bin_20: asBin(bins.bin_20, 'bin_20'),
      bin_21: asBin(bins.bin_21, 'bin_21'),
      bin_22: asBin(bins.bin_22, 'bin_22'),
      bin_23: asBin(bins.bin_23, 'bin_23'),
      bin_24: asBin(bins.bin_24, 'bin_24'),
      bin_25: asBin(bins.bin_25, 'bin_25'),
      bin_26: asBin(bins.bin_26, 'bin_26'),
      bin_27: asBin(bins.bin_27, 'bin_27'),
      bin_28: asBin(bins.bin_28, 'bin_28'),
      bin_29: asBin(bins.bin_29, 'bin_29'),
      bin_30: asBin(bins.bin_30, 'bin_30'),
      bin_31: asBin(bins.bin_31, 'bin_31'),
    },
  }
}

export async function pingPeer(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<PingResponse> {
  const response = await http<PingResponse>(requestOptions, {
    url: `pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.data
}

function asBin(value: unknown, name: string): Bin {
  const bin = Types.asObject(value, { name })

  if (!bin.disconnectedPeers) {
    bin.disconnectedPeers = []
  }

  if (!bin.connectedPeers) {
    bin.connectedPeers = []
  }

  return {
    population: Types.asNumber(bin.population, { name: 'population' }),
    connected: Types.asNumber(bin.connected, { name: 'connected' }),
    connectedPeers: Types.asArray(bin.connectedPeers, { name: 'connectedPeers' }).map(x => ({
      address: Types.asString(Types.asObject(x, { name: 'connectedPeer' }).address, { name: 'address' }),
    })),
    disconnectedPeers: Types.asArray(bin.disconnectedPeers, { name: 'disconnectedPeers' }).map(x => ({
      address: Types.asString(Types.asObject(x, { name: 'disconnectedPeer' }).address, { name: 'address' }),
    })),
  }
}
