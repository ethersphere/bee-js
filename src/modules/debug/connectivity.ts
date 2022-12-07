import { http } from '../../utils/http'
import type { NodeAddresses, Peer, PingResponse, RemovePeerResponse, Topology } from '../../types'
import type { Options as KyOptions } from 'ky'

export async function getNodeAddresses(kyOptions: KyOptions): Promise<NodeAddresses> {
  const response = await http<NodeAddresses>(kyOptions, {
    path: 'addresses',
    responseType: 'json',
  })

  return response.parseData
}
interface Peers {
  peers: Peer[]
}

export async function getPeers(kyOptions: KyOptions): Promise<Peer[]> {
  const response = await http<Peers>(kyOptions, {
    path: 'peers',
    responseType: 'json',
  })

  return response.parseData.peers
}

export async function getBlocklist(kyOptions: KyOptions): Promise<Peer[]> {
  const response = await http<Peers>(kyOptions, {
    path: 'blocklist',
    responseType: 'json',
  })

  return response.parseData.peers
}

export async function removePeer(kyOptions: KyOptions, peer: string): Promise<RemovePeerResponse> {
  const response = await http<RemovePeerResponse>(kyOptions, {
    path: `peers/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.parseData
}

export async function getTopology(kyOptions: KyOptions): Promise<Topology> {
  const response = await http<Topology>(kyOptions, {
    path: `topology`,
    responseType: 'json',
  })

  return response.parseData
}

export async function pingPeer(kyOptions: KyOptions, peer: string): Promise<PingResponse> {
  const response = await http<PingResponse>(kyOptions, {
    path: `pingpong/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.parseData
}
