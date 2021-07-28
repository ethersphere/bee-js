import { http } from '../../utils/http'
import type { NodeAddresses, Peer, PingResponse, RemovePeerResponse, Topology } from '../../types'

export async function getNodeAddresses(ky: Ky): Promise<NodeAddresses> {
  const response = await http<NodeAddresses>({
    url: url + '/addresses',
    responseType: 'json',
  })

  return response.data
}
interface Peers {
  peers: Peer[]
}

export async function getPeers(ky: Ky): Promise<Peer[]> {
  const response = await http<Peers>({
    url: url + '/peers',
    responseType: 'json',
  })

  return response.data.peers || []
}

export async function getBlocklist(ky: Ky): Promise<Peer[]> {
  const response = await http<Peers>({
    url: url + '/blocklist',
    responseType: 'json',
  })

  return response.data.peers || []
}

export async function removePeer(ky: Ky, peer: string): Promise<RemovePeerResponse> {
  const response = await http<RemovePeerResponse>({
    url: `${url}/peers/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.data
}

export async function getTopology(ky: Ky): Promise<Topology> {
  const response = await http<Topology>({
    url: `${url}/topology`,
    responseType: 'json',
  })

  return response.data
}

export async function pingPeer(ky: Ky, peer: string): Promise<PingResponse> {
  const response = await http<PingResponse>({
    url: `${url}/pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.data
}
