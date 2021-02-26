import { safeAxios } from '../../utils/safeAxios'
import { NodeAddresses, Peer } from '../../types'

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
