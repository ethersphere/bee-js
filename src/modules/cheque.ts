import type {
  BeeRequestOptions,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  TransactionOptions,
} from '../types'
import { TransactionOptionsSchema } from '../utils/schema'
import { PeerAddress, TransactionId } from '../utils/typed-bytes'
import * as api from '../api/chequebook'
import type { BeeContext } from './context'

/**
 * Cheque operations (last cheques and cashouts).
 *
 * Accessed as `bee.cheque`.
 */
export class Cheque {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets the last cheques for all peers.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllLatest(requestOptions?: BeeRequestOptions): Promise<LastChequesResponse> {
    return api.getLastCheques(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the last cheques for a specific peer.
   *
   * @param address Overlay address of peer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllLatestForPeer(
    address: PeerAddress | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<LastChequesForPeerResponse> {
    const peer = new PeerAddress(address)

    return api.getLastChequesForPeer(this.context.getRequestOptionsForCall(requestOptions), peer)
  }

  /**
   * Gets the last cashout action for a specific peer.
   *
   * @param address Overlay address of peer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getLastCashoutAction(
    address: PeerAddress | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<LastCashoutActionResponse> {
    const peer = new PeerAddress(address)

    return api.getLastCashoutAction(this.context.getRequestOptionsForCall(requestOptions), peer)
  }

  /**
   * Cashes out the last cheque for a specific peer.
   *
   * @param address Swarm address of peer
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async cashoutLast(
    address: PeerAddress | string,
    options?: TransactionOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const peer = new PeerAddress(address)

    if (options) {
      options = TransactionOptionsSchema.parse(options)
    }

    return api.cashoutLastCheque(this.context.getRequestOptionsForCall(requestOptions), peer, options)
  }
}
