import type { BeeRequestOptions, NumberString, TransactionInfo } from '../types'
import {
  GetAllTransactionsResponse,
  GetTransactionResponse,
  TransactionHashResponse,
} from '../types/schema/transactions'
import { http } from '../utils/http'
import { asNumberString } from '../utils/type'
import { TransactionId } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const transactionsEndpoint = 'transactions'

/**
 * Pending transaction operations for the Bee node's `/transactions` queue.
 *
 * Accessed as `bee.transaction`.
 */
export class Transaction {
  constructor(private readonly context: BeeContext) {}

  /**
   * Fetches the list of all current pending transactions for the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<TransactionInfo[]> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: transactionsEndpoint,
      responseType: 'json',
    })

    return GetAllTransactionsResponse.parse(response.data).pendingTransactions
  }

  /**
   * Fetches the transaction information for a specific pending transaction.
   *
   * @param transactionHash Hash of the transaction
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(
    transactionHash: TransactionId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionInfo> {
    const hash = new TransactionId(transactionHash)

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${transactionsEndpoint}/${hash}`,
      responseType: 'json',
    })

    return GetTransactionResponse.parse(response.data)
  }

  /**
   * Rebroadcasts an already created pending transaction.
   *
   * Mainly needed when the transaction falls off the mempool or is not incorporated into any block.
   *
   * @param transactionHash Hash of the transaction
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async rebroadcast(
    transactionHash: TransactionId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const hash = new TransactionId(transactionHash)

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${transactionsEndpoint}/${hash}`,
      responseType: 'json',
    })

    return TransactionHashResponse.parse(response.data).transactionHash
  }

  /**
   * Cancels a currently pending transaction.
   *
   * @param transactionHash Hash of the transaction
   * @param gasPrice Optional gas price
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async cancel(
    transactionHash: TransactionId | Uint8Array | string,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const hash = new TransactionId(transactionHash)
    const headers: Record<string, string> = {}

    if (gasPrice) {
      headers['gas-price'] = asNumberString(gasPrice, { min: 0n, name: 'gasPrice' })
    }

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'delete',
      headers,
      url: `${transactionsEndpoint}/${hash}`,
      responseType: 'json',
    })

    return TransactionHashResponse.parse(response.data).transactionHash
  }
}
