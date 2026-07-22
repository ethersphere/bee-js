import type { BeeRequestOptions, Peer, PingResponse, RemovePeerResponse, Topology } from '../types'
import { NodeAddresses } from '../types/debug'
import {
  GetBlocklistResponse,
  GetNodeAddressesResponse,
  GetPeersResponse,
  GetTopologyResponse,
} from '../types/schema/connectivity'
import { IsGatewayResponse } from '../types/schema/status'
import { http } from '../utils/http'
import { PeerAddress } from '../utils/typed-bytes'

const addressesEndpoint = 'addresses'
const blocklistEndpoint = 'blocklist'
const peersEndpoint = 'peers'
const topologyEndpoint = 'topology'
const pingpongEndpoint = 'pingpong'
const gatewayEndpoint = '/gateway'

/**
 * Raw HTTP calls for the connectivity endpoints (`/addresses`, `/peers`, `/topology`, `/blocklist`, `/pingpong`, etc.).
 */

/** Pings the Bee node to see if there is a live Bee node on the given URL. */
export async function checkConnection(requestOptions: BeeRequestOptions): Promise<void> {
  await http<unknown>(requestOptions, {
    url: '',
    responseType: 'text',
  })
}

/** Checks the `/gateway` endpoint to see if the remote API is a gateway. */
export async function isGateway(requestOptions: BeeRequestOptions): Promise<boolean> {
  const response = await http<unknown>(requestOptions, {
    url: gatewayEndpoint,
  })

  return IsGatewayResponse.parse(response.data).gateway
}

/** Fetches the overlay, underlay, Ethereum, and other addresses of the Bee node. */
export async function getNodeAddresses(requestOptions: BeeRequestOptions): Promise<NodeAddresses> {
  const response = await http<unknown>(requestOptions, {
    url: addressesEndpoint,
    responseType: 'json',
  })

  return GetNodeAddressesResponse.parse(response.data)
}

/** Fetches the list of blocked peers for this node. */
export async function getBlocklist(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<unknown>(requestOptions, {
    url: blocklistEndpoint,
    responseType: 'json',
  })

  return GetBlocklistResponse.parse(response.data).peers
}

/** Gets list of peers for this node. */
export async function getPeers(requestOptions: BeeRequestOptions): Promise<Peer[]> {
  const response = await http<unknown>(requestOptions, {
    url: peersEndpoint,
    responseType: 'json',
  })

  return GetPeersResponse.parse(response.data).peers
}

/** Disconnects from a specific peer. */
export async function removePeer(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<RemovePeerResponse> {
  const response = await http<RemovePeerResponse>(requestOptions, {
    url: `${peersEndpoint}/${peer}`,
    responseType: 'json',
    method: 'DELETE',
  })

  return response.data
}

/** Fetches topology and connectivity information of the Bee node. */
export async function getTopology(requestOptions: BeeRequestOptions): Promise<Topology> {
  const response = await http<unknown>(requestOptions, {
    url: topologyEndpoint,
    responseType: 'json',
  })

  return GetTopologyResponse.parse(response.data) as Topology
}

/** Pings a specific peer to check its availability. */
export async function ping(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<PingResponse> {
  const response = await http<PingResponse>(requestOptions, {
    url: `${pingpongEndpoint}/${peer}`,
    responseType: 'json',
    method: 'POST',
  })

  return response.data
}
