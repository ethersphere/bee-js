import type {
  BeeRequestOptions,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  TransactionOptions,
} from '../types'
import {
  GetLastCashoutActionResponse,
  GetLastChequesForPeerResponse,
  GetLastChequesResponse,
  TransactionHashResponse,
} from '../types/schema/chequebook'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { TransactionOptionsSchema } from '../utils/schema'
import { PeerAddress, TransactionId } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const chequebookEndpoint = 'chequebook'

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
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${chequebookEndpoint}/cheque`,
      responseType: 'json',
    })

    return GetLastChequesResponse.parse(response.data)
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${chequebookEndpoint}/cheque/${peer}`,
      responseType: 'json',
    })

    return GetLastChequesForPeerResponse.parse(response.data)
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${chequebookEndpoint}/cashout/${peer}`,
      responseType: 'json',
    })

    return GetLastCashoutActionResponse.parse(response.data)
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${chequebookEndpoint}/cashout/${peer}`,
      responseType: 'json',
      headers: prepareRequestHeaders(null, options),
    })

    return TransactionHashResponse.parse(response.data).transactionHash
  }
}
