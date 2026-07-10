import * as api from '../api/balance'
import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../types'
import { PeerAddress } from '../utils/typed-bytes'
import type { BeeContext } from './context'

/**
 * SWAP balance operations. Related to the bandwidth incentives and the chequebook.
 *
 * Accessed as `bee.balance`.
 */
export class Balance {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets the SWAP balances with all known peers including prepaid services.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<BalanceResponse> {
    return api.getBalances(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the SWAP balances for a specific peer including prepaid services.
   *
   * @param address Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPeer(address: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<PeerBalance> {
    const peer = new PeerAddress(address)

    return api.getPeerBalance(this.context.getRequestOptionsForCall(requestOptions), peer)
  }

  /**
   * Gets the past due consumption balances for all known peers.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllPastDueConsumption(requestOptions?: BeeRequestOptions): Promise<BalanceResponse> {
    return api.getPastDueConsumptionBalances(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the past due consumption balance for a specific peer.
   *
   * @param address Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllPastDueConsumptionForPeer(
    address: PeerAddress | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<PeerBalance> {
    const peer = new PeerAddress(address)

    return api.getPastDueConsumptionPeerBalance(this.context.getRequestOptionsForCall(requestOptions), peer)
  }
}
