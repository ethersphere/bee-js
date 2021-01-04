import { safeAxios } from '../../utils/safeAxios'

export interface NodeAddresses {
  overlay: string
  underlay: string[]
  ethereum: string
  public_key: string
  pss_public_key: string
}

export async function getNodeAddresses(url: string): Promise<NodeAddresses> {
  const response = await safeAxios<NodeAddresses>({
    url: url + '/addresses',
    responseType: 'json',
  })

  return response.data
}

export interface Peer {
  address: string
}
export interface Peers {
  peers: Peer[]
}

export async function getPeers(url: string): Promise<Peers> {
  const response = await safeAxios<Peers>({
    url: url + '/peers',
    responseType: 'json',
  })

  return response.data
}
