import type { BeeRequestOptions, NumberString, TransactionInfo } from '../types'
import {
  GetAllTransactionsResponse,
  GetTransactionResponse,
  TransactionHashResponse,
} from '../types/schema/transactions'
import { http } from '../utils/http'
import { TransactionId } from '../utils/typed-bytes'

const transactionsEndpoint = 'transactions'

/**
 * Raw HTTP calls for the `/transactions` endpoint.
 */

export async function getAllTransactions(requestOptions: BeeRequestOptions): Promise<TransactionInfo[]> {
  const response = await http<unknown>(requestOptions, {
    url: transactionsEndpoint,
    responseType: 'json',
  })

  return GetAllTransactionsResponse.parse(response.data).pendingTransactions
}

export async function getTransaction(requestOptions: BeeRequestOptions, hash: TransactionId): Promise<TransactionInfo> {
  const response = await http<unknown>(requestOptions, {
    url: `${transactionsEndpoint}/${hash}`,
    responseType: 'json',
  })

  return GetTransactionResponse.parse(response.data)
}

export async function rebroadcastTransaction(
  requestOptions: BeeRequestOptions,
  hash: TransactionId,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${transactionsEndpoint}/${hash}`,
    responseType: 'json',
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}

export async function cancelTransaction(
  requestOptions: BeeRequestOptions,
  hash: TransactionId,
  gasPrice?: NumberString,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    headers,
    url: `${transactionsEndpoint}/${hash}`,
    responseType: 'json',
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}
