import type { BeeRequestOptions, Peer, PingResponse, RemovePeerResponse, Topology } from '../types'
import { NodeAddresses } from '../types/debug'
import { PeerAddress } from '../utils/typed-bytes'
import * as api from '../api/connectivity'
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
    return api.checkConnection(this.context.getRequestOptionsForCall(requestOptions))
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
      return await api.isGateway(this.context.getRequestOptionsForCall(requestOptions))
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
    return api.getNodeAddresses(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Fetches the list of blocked peers for this node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getBlocklist(requestOptions?: BeeRequestOptions): Promise<Peer[]> {
    return api.getBlocklist(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets list of peers for this node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPeers(requestOptions?: BeeRequestOptions): Promise<Peer[]> {
    return api.getPeers(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Disconnects from a specific peer.
   *
   * @param peer Overlay address of the peer to be removed.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async removePeer(peer: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<RemovePeerResponse> {
    const address = new PeerAddress(peer)

    return api.removePeer(this.context.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Fetches topology and connectivity information of the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getTopology(requestOptions?: BeeRequestOptions): Promise<Topology> {
    return api.getTopology(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Pings a specific peer to check its availability.
   *
   * @param peer Overlay address of the peer to be pinged.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async ping(peer: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<PingResponse> {
    const address = new PeerAddress(peer)

    return api.ping(this.context.getRequestOptionsForCall(requestOptions), address)
  }
}
