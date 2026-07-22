import type { BeeRequestOptions, NumberString, TransactionInfo } from '../types'
import { asNumberString } from '../utils/type'
import { TransactionId } from '../utils/typed-bytes'
import * as api from '../api/transaction'
import type { BeeContext } from './context'

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
    return api.getAllTransactions(this.context.getRequestOptionsForCall(requestOptions))
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

    return api.getTransaction(this.context.getRequestOptionsForCall(requestOptions), hash)
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

    return api.rebroadcastTransaction(this.context.getRequestOptionsForCall(requestOptions), hash)
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
    const gasPriceString = gasPrice ? asNumberString(gasPrice, { min: 0n, name: 'gasPrice' }) : undefined

    return api.cancelTransaction(this.context.getRequestOptionsForCall(requestOptions), hash, gasPriceString)
  }
}
