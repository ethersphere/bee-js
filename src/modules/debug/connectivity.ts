import { http } from '../../utils/http'
import type { Ky, NodeAddresses, Peer, PingResponse, RemovePeerResponse, Topology } from '../../types'

export async function getNodeAddresses(ky: Ky): Promise<NodeAddresses> {
  const response = await http<NodeAddresses>(ky, {
    path: 'addresses',
    responseType: 'json',
  })

  return response.parsedData
}
interface Peers {
  peers: Peer[]
}

export async function getPeers(ky: Ky): Promise<Peer[]> {
  const response = await http<Peers>(ky, {
    path: 'peers',
    responseType: 'json',
  })

  return response.parsedData.peers
}

export async function getBlocklist(ky: Ky): Promise<Peer[]> {
  const response = await http<Peers>(ky, {
    path: 'blocklist',
    responseType: 'json',
  })

  return response.parsedData.peers
}

export async function removePeer(ky: Ky, peer: string): Promise<RemovePeerResponse> {
  const response = await http<RemovePeerResponse>(ky, {
    path: `peers/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.parsedData
}

export async function getTopology(ky: Ky): Promise<Topology> {
  const response = await http<Topology>(ky, {
    path: `topology`,
    responseType: 'json',
  })

  return response.parsedData
}

export async function pingPeer(ky: Ky, peer: string): Promise<PingResponse> {
  const response = await http<PingResponse>(ky, {
    path: `pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.parsedData
}
