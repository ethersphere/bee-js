import { http } from '../../utils/http.js'

import type { Ky, NumberString, TransactionHash, TransactionInfo } from '../../types/index.js'

const transactionsEndpoint = 'transactions'

interface PendingTransactionsResponse {
  pendingTransactions: TransactionInfo[]
}

interface TransactionResponse {
  transactionHash: TransactionHash
}

/**
 * Get list of all pending transactions
 *
 * @param ky   Debug Ky instance
 */
export async function getAllTransactions(ky: Ky): Promise<TransactionInfo[]> {
  const response = await http<PendingTransactionsResponse>(ky, {
    path: transactionsEndpoint,
    responseType: 'json',
  })

  return response.data.pendingTransactions
}

/**
 * Get information for specific pending transactions
 *
 * @param ky   Debug Ky instance
 * @param transactionHash Hash of the transaction
 */
export async function getTransaction(ky: Ky, transactionHash: TransactionHash): Promise<TransactionInfo> {
  const response = await http<TransactionInfo>(ky, {
    path: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Rebroadcast existing transaction
 *
 * @param ky   Debug Ky instance
 * @param transactionHash Hash of the transaction
 */
export async function rebroadcastTransaction(ky: Ky, transactionHash: TransactionHash): Promise<TransactionHash> {
  const response = await http<TransactionResponse>(ky, {
    method: 'post',
    path: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.data.transactionHash
}

/**
 * Cancel existing transaction
 *
 * @param ky   Debug Ky instance
 * @param transactionHash Hash of the transaction
 * @param gasPrice Optional gas price
 */
export async function cancelTransaction(
  ky: Ky,
  transactionHash: TransactionHash,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const response = await http<TransactionResponse>(ky, {
    method: 'delete',
    headers: { 'gas-price': gasPrice },
    path: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.data.transactionHash
}
