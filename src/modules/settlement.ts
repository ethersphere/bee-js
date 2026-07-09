import type { AllSettlements, BeeRequestOptions, Settlements } from '../types'
import { GetAllSettlementsResponse, GetSettlementsResponse } from '../types/schema/settlements'
import { http } from '../utils/http'
import { PeerAddress } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const settlementsEndpoint = 'settlements'

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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${settlementsEndpoint}/${peer}`,
      responseType: 'json',
    })

    return GetSettlementsResponse.parse(response.data)
  }

  /**
   * Gets settlements with all known peers and total amount sent or received.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<AllSettlements> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: settlementsEndpoint,
      responseType: 'json',
    })

    return GetAllSettlementsResponse.parse(response.data)
  }
}
