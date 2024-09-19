import type { BeeRequestOptions, NodeAddresses, Peer, PingResponse, RemovePeerResponse, Topology } from '../../types'
import { http } from '../../utils/http'

export async function getNodeAddresses(requestOptions: BeeRequestOptions): Promise<NodeAddresses> {
  const response = await http<NodeAddresses>(requestOptions, {
    url: 'addresses',
    responseType: 'json',
  })

  return response.data
}

interface Peers {
  peers: Peer[]
}

export async function getPeers(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<Peers>(requestOptions, {
    url: 'peers',
    responseType: 'json',
  })

  return response.data.peers
}

export async function getBlocklist(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<Peers>(requestOptions, {
    url: 'blocklist',
    responseType: 'json',
  })

  return response.data.peers
}

export async function removePeer(requestOptions: BeeRequestOptions, peer: string): Promise<RemovePeerResponse> {
  const response = await http<RemovePeerResponse>(requestOptions, {
    url: `peers/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.data
}

export async function getTopology(requestOptions: BeeRequestOptions): Promise<Topology> {
  const response = await http<Topology>(requestOptions, {
    url: `topology`,
    responseType: 'json',
  })

  return response.data
}

export async function pingPeer(requestOptions: BeeRequestOptions, peer: string): Promise<PingResponse> {
  const response = await http<PingResponse>(requestOptions, {
    url: `pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.data
}
