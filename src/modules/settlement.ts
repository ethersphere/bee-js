import type { AllSettlements, BeeRequestOptions, Settlements } from '../types'
import { PeerAddress } from '../utils/typed-bytes'
import * as api from '../api/settlement'
import type { BeeContext } from './context'

/**
 * Settlement operations. Related to the bandwidth incentives and the chequebook.
 *
 * Accessed as `bee.settlement`.
 */
export class Settlement {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets the amount of sent and received micropayments from settlements with a peer.
   *
   * @param address Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(address: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<Settlements> {
    const peer = new PeerAddress(address)

    return api.getSettlements(this.context.getRequestOptionsForCall(requestOptions), peer)
  }

  /**
   * Gets settlements with all known peers and total amount sent or received.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<AllSettlements> {
    return api.getAllSettlements(this.context.getRequestOptionsForCall(requestOptions))
  }
}
