import { safeAxios } from '../../utils/safeAxios'
import type {
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  TransactionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
} from '../../types'
import { CashoutOptions } from '../../types'

const chequebookEndpoint = '/chequebook'

/**
 * Get the address of the chequebook contract used
 *
 * @param url Bee debug url
 */
export async function getChequebookAddress(url: string): Promise<ChequebookAddressResponse> {
  const response = await safeAxios<ChequebookAddressResponse>({
    url: url + chequebookEndpoint + '/address',
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the balance of the chequebook
 *
 * @param url Bee debug url
 */
export async function getChequebookBalance(url: string): Promise<ChequebookBalanceResponse> {
  const response = await safeAxios<ChequebookBalanceResponse>({
    url: url + chequebookEndpoint + '/balance',
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Get last cashout action for the peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 */
export async function getLastCashoutAction(url: string, peer: string): Promise<LastCashoutActionResponse> {
  const response = await safeAxios<LastCashoutActionResponse>({
    url: url + chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Cashout the last cheque for the peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 * @param options
 */
export async function cashoutLastCheque(url: string, peer: string, options?: CashoutOptions): Promise<string> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.gasLimit) {
    headers['gas-limit'] = options.gasLimit.toString()
  }

  const response = await safeAxios<TransactionResponse>({
    method: 'post',
    url: url + chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
    headers,
  })

  return response.data.transactionHash
}

/**
 * Get last cheques for the peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 */
export async function getLastChequesForPeer(url: string, peer: string): Promise<LastChequesForPeerResponse> {
  const response = await safeAxios<LastChequesForPeerResponse>({
    url: url + chequebookEndpoint + `/cheque/${peer}`,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Get last cheques for all peers
 *
 * @param url   Bee debug url
 */
export async function getLastCheques(url: string): Promise<LastChequesResponse> {
  const response = await safeAxios<LastChequesResponse>({
    url: url + chequebookEndpoint + '/cheque',
    responseType: 'json',
  })

  return response.data
}

/**
 * Deposit tokens from overlay address into chequebook
 *
 * @param url      Bee debug url
 * @param amount   Amount of tokens to deposit
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function depositTokens(url: string, amount: number | bigint, gasPrice?: bigint): Promise<string> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await safeAxios<TransactionResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/deposit',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return response.data.transactionHash
}

/**
 * Withdraw tokens from the chequebook to the overlay address
 *
 * @param url      Bee debug url
 * @param amount   Amount of tokens to withdraw
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function withdrawTokens(url: string, amount: number | bigint, gasPrice?: bigint): Promise<string> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await safeAxios<TransactionResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return response.data.transactionHash
}
