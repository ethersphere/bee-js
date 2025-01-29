import { Types } from 'cafe-utility'
import { BeeRequestOptions, NumberString, TransactionInfo } from '../../types'
import { http } from '../../utils/http'
import { asNumberString } from '../../utils/type'
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

  const body = Types.asObject(response.data, { name: 'response.data' })
  const pendingTransactions = Types.asArray(body.pendingTransactions, { name: 'pendingTransactions' })

  return pendingTransactions.map(toTransaction)
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return toTransaction(body)
}

function toTransaction(value: unknown) {
  const object = Types.asObject(value, { name: 'transaction' })

  return {
    transactionHash: new TransactionId(Types.asString(object.transactionHash, { name: 'transactionHash' })),
    to: Types.asString(object.to, { name: 'to' }),
    nonce: Types.asNumber(object.nonce, { name: 'nonce' }),
    gasPrice: asNumberString(object.gasPrice, { name: 'gasPrice' }),
    gasLimit: Types.asNumber(object.gasLimit, { name: 'gasLimit' }),
    data: Types.asString(object.data, { name: 'data' }),
    created: Types.asString(object.created, { name: 'created' }),
    description: Types.asString(object.description, { name: 'description' }),
    value: asNumberString(object.value, { name: 'value' }),
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
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
  gasPrice?: NumberString,
): Promise<TransactionId> {
  const headers: Record<string, string | number> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }
  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    headers,
    url: `${transactionsEndpoint}/${transactionHash}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
}
