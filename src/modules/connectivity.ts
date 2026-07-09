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
import type { BeeContext } from './context'

/**
 * Peer, topology and network connectivity operations.
 *
 * Accessed as `bee.connectivity`.
 */
export class Connectivity {
  constructor(private readonly context: BeeContext) {}

  /**
   * Pings the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @throws If connection was not successful throw error
   */
  async checkConnection(requestOptions?: BeeRequestOptions): Promise<void> {
    await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: '',
      responseType: 'text',
    })
  }

  /**
   * Pings the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns true if successful, false on error
   */
  async isConnected(requestOptions?: BeeRequestOptions): Promise<boolean> {
    try {
      await this.checkConnection(requestOptions)
    } catch {
      return false
    }

    return true
  }

  /**
   * Checks the `/gateway` endpoint to see if the remote API is a gateway.
   *
   * Do note that this is not a standard way to check for gateway nodes,
   * but some of the gateway tooling expose this endpoint.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isGateway(requestOptions?: BeeRequestOptions): Promise<boolean> {
    try {
      const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
        url: '/gateway',
      })

      return IsGatewayResponse.parse(response.data).gateway
    } catch {
      return false
    }
  }

  /**
   * Fetches the overlay, underlay, Ethereum, and other addresses of the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getNodeAddresses(requestOptions?: BeeRequestOptions): Promise<NodeAddresses> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: 'addresses',
      responseType: 'json',
    })

    return GetNodeAddressesResponse.parse(response.data)
  }

  /**
   * Fetches the list of blocked peers for this node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getBlocklist(requestOptions?: BeeRequestOptions): Promise<Peer[]> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: 'blocklist',
      responseType: 'json',
    })

    return GetBlocklistResponse.parse(response.data).peers
  }

  /**
   * Gets list of peers for this node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPeers(requestOptions?: BeeRequestOptions): Promise<Peer[]> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: 'peers',
      responseType: 'json',
    })

    return GetPeersResponse.parse(response.data).peers
  }

  /**
   * Disconnects from a specific peer.
   *
   * @param peer Overlay address of the peer to be removed.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async removePeer(peer: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<RemovePeerResponse> {
    const address = new PeerAddress(peer)

    const response = await http<RemovePeerResponse>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `peers/${address}`,
      responseType: 'json',
      method: 'DELETE',
    })

    return response.data
  }

  /**
   * Fetches topology and connectivity information of the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getTopology(requestOptions?: BeeRequestOptions): Promise<Topology> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: 'topology',
      responseType: 'json',
    })

    return GetTopologyResponse.parse(response.data) as Topology
  }

  /**
   * Pings a specific peer to check its availability.
   *
   * @param peer Overlay address of the peer to be pinged.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async ping(peer: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<PingResponse> {
    const address = new PeerAddress(peer)

    const response = await http<PingResponse>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `pingpong/${address}`,
      responseType: 'json',
      method: 'POST',
    })

    return response.data
  }
}
