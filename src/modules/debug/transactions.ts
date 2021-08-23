import { safeAxios } from '../../utils/safe-axios'
import { NumberString, TransactionHash, TransactionInfo } from '../../types'

const transactionsEndpoint = '/transactions'

interface PendingTransactionsResponse {
  pendingTransactions: TransactionInfo[]
}

interface TransactionResponse {
  transactionHash: TransactionHash
}

/**
 * Get list of all pending transactions
 *
 * @param url   Bee debug url
 */
export async function getAllTransactions(url: string): Promise<TransactionInfo[]> {
  const response = await safeAxios<PendingTransactionsResponse>({
    url: `${url}${transactionsEndpoint}`,
    responseType: 'json',
  })

  return response.data.pendingTransactions
}

/**
 * Get information for specific pending transactions
 *
 * @param url   Bee debug url
 * @param transactionHash Hash of the transaction
 */
export async function getTransaction(url: string, transactionHash: TransactionHash): Promise<TransactionInfo> {
  const response = await safeAxios<TransactionInfo>({
    url: `${url}${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Rebroadcast existing transaction
 *
 * @param url   Bee debug url
 * @param transactionHash Hash of the transaction
 */
export async function rebroadcastTransaction(url: string, transactionHash: TransactionHash): Promise<TransactionHash> {
  const response = await safeAxios<TransactionResponse>({
    method: 'post',
    url: `${url}${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.data.transactionHash
}

/**
 * Cancel existing transaction
 *
 * @param url   Bee debug url
 * @param transactionHash Hash of the transaction
 * @param gasPrice Optional gas price
 */
export async function cancelTransaction(
  url: string,
  transactionHash: TransactionHash,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const response = await safeAxios<TransactionResponse>({
    method: 'delete',
    headers: { 'gas-price': gasPrice },
    url: `${url}${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  return response.data.transactionHash
}
