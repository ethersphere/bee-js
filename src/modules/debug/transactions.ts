import { NumberString, TransactionHash, TransactionInfo } from '../../types'
import { http } from '../../utils/http'
import type { Options as KyOptions } from 'ky'

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
export async function getAllTransactions(kyOptions: KyOptions): Promise<TransactionInfo[]> {
  const response = await http<PendingTransactionsResponse>(kyOptions, {
    path: transactionsEndpoint,
    responseType: 'json',
  })

  return response.parsedData.pendingTransactions
}

/**
 * Get information for specific pending transactions
 *
 * @param ky   Debug Ky instance
 * @param transactionHash Hash of the transaction
 */
export async function getTransaction(kyOptions: KyOptions, transactionHash: TransactionHash): Promise<TransactionInfo> {
  const response = await http<TransactionInfo>(kyOptions, {
    path: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Rebroadcast existing transaction
 *
 * @param ky   Debug Ky instance
 * @param transactionHash Hash of the transaction
 */
export async function rebroadcastTransaction(
  kyOptions: KyOptions,
  transactionHash: TransactionHash,
): Promise<TransactionHash> {
  const response = await http<TransactionResponse>(kyOptions, {
    method: 'post',
    path: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.parsedData.transactionHash
}

/**
 * Cancel existing transaction
 *
 * @param ky   Debug Ky instance
 * @param transactionHash Hash of the transaction
 * @param gasPrice Optional gas price
 */
export async function cancelTransaction(
  kyOptions: KyOptions,
  transactionHash: TransactionHash,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const response = await http<TransactionResponse>(kyOptions, {
    method: 'delete',
    headers: { 'gas-price': gasPrice },
    path: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.parsedData.transactionHash
}
