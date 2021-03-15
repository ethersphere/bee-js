import { safeAxios } from '../../utils/safeAxios'
import { NodeAddresses, Peer, PingResponse, RemovePeerResponse, Topology } from '../../types'

export async function getNodeAddresses(url: string): Promise<NodeAddresses> {
  const response = await safeAxios<NodeAddresses>({
    url: url + '/addresses',
    responseType: 'json',
  })

  return response.data
}
interface Peers {
  peers: Peer[]
}

export async function getPeers(url: string): Promise<Peer[]> {
  const response = await safeAxios<Peers>({
    url: url + '/peers',
    responseType: 'json',
  })

  return response.data.peers
}

export async function getBlocklist(url: string): Promise<Peer[]> {
  const response = await safeAxios<Peers>({
    url: url + '/blocklist',
    responseType: 'json',
  })

  return response.data.peers
}

export async function removePeer(url: string, peer: string): Promise<RemovePeerResponse> {
  const response = await safeAxios<RemovePeerResponse>({
    url: `${url}/peers/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.data
}

export async function getTopology(url: string): Promise<Topology> {
  const response = await safeAxios<Topology>({
    url: `${url}/topology`,
    responseType: 'json',
  })

  return response.data
}

export async function pingPeer(url: string, peer: string): Promise<PingResponse> {
  const response = await safeAxios<PingResponse>({
    url: `${url}/pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.data
}
