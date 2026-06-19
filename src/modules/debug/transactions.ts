import { BeeRequestOptions, NumberString, TransactionInfo } from '../../types'
import {
  GetAllTransactionsResponse,
  GetTransactionResponse,
  TransactionHashResponse,
} from '../../types/schema/transactions'
import { http } from '../../utils/http'
import { TransactionId } from '../../utils/typed-bytes'

const transactionsEndpoint = 'transactions'

/**
 * Get list of all pending transactions
 *
 * @param requestOptions Options for making requests
 */
export async function getAllTransactions(requestOptions: BeeRequestOptions): Promise<TransactionInfo[]> {
  const response = await http<unknown>(requestOptions, {
    url: transactionsEndpoint,
    responseType: 'json',
  })

  return GetAllTransactionsResponse.parse(response.data).pendingTransactions
}

/**
 * Get information for specific pending transactions
 *
 * @param requestOptions Options for making requests
 * @param transactionHash Hash of the transaction
 */
export async function getTransaction(
  requestOptions: BeeRequestOptions,
  transactionHash: TransactionId,
): Promise<TransactionInfo> {
  const response = await http<unknown>(requestOptions, {
    url: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return GetTransactionResponse.parse(response.data)
}

/**
 * Rebroadcast existing transaction
 *
 * @param requestOptions Options for making requests
 * @param transactionHash Hash of the transaction
 */
export async function rebroadcastTransaction(
  requestOptions: BeeRequestOptions,
  transactionHash: TransactionId,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}

/**
 * Cancel existing transaction
 *
 * @param requestOptions Options for making requests
 * @param transactionHash Hash of the transaction
 * @param gasPrice Optional gas price
 */
export async function cancelTransaction(
  requestOptions: BeeRequestOptions,
  transactionHash: TransactionId,
  gasPrice?: NumberString | string | bigint,
): Promise<TransactionId> {
  const headers: Record<string, string | number> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    headers,
    url: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}
