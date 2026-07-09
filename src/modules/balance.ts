import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../types'
import { GetAllBalancesResponse, GetPeerBalanceResponse } from '../types/schema/balance'
import { http } from '../utils/http'
import { PeerAddress } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const balancesEndpoint = 'balances'
const consumedEndpoint = 'consumed'

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
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: balancesEndpoint,
      responseType: 'json',
    })

    return GetAllBalancesResponse.parse(response.data)
  }

  /**
   * Gets the SWAP balances for a specific peer including prepaid services.
   *
   * @param address Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPeer(address: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<PeerBalance> {
    const peer = new PeerAddress(address)

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${balancesEndpoint}/${peer}`,
      responseType: 'json',
    })

    return GetPeerBalanceResponse.parse(response.data)
  }

  /**
   * Gets the past due consumption balances for all known peers.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllPastDueConsumption(requestOptions?: BeeRequestOptions): Promise<BalanceResponse> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: consumedEndpoint,
      responseType: 'json',
    })

    return GetAllBalancesResponse.parse(response.data)
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${consumedEndpoint}/${peer}`,
      responseType: 'json',
    })

    return GetPeerBalanceResponse.parse(response.data)
  }
}
