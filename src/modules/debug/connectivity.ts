import type { BeeRequestOptions, Peer, PingResponse, RemovePeerResponse, Topology } from '../../types'
import {
  GetBlocklistResponse,
  GetNodeAddressesResponse,
  GetPeersResponse,
  GetTopologyResponse,
} from '../../types/schema/connectivity'
import { NodeAddresses } from '../../types/debug'
import { http } from '../../utils/http'
import { PeerAddress } from '../../utils/typed-bytes'

export async function getNodeAddresses(requestOptions: BeeRequestOptions): Promise<NodeAddresses> {
  const response = await http<unknown>(requestOptions, {
    url: 'addresses',
    responseType: 'json',
  })

  return GetNodeAddressesResponse.parse(response.data)
}

export async function getPeers(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<unknown>(requestOptions, {
    url: 'peers',
    responseType: 'json',
  })

  return GetPeersResponse.parse(response.data).peers
}

export async function getBlocklist(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<unknown>(requestOptions, {
    url: 'blocklist',
    responseType: 'json',
  })

  return GetBlocklistResponse.parse(response.data).peers
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

  return GetTopologyResponse.parse(response.data) as Topology
}

export async function pingPeer(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<PingResponse> {
  const response = await http<PingResponse>(requestOptions, {
    url: `pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.data
}
