import { http } from '../../utils/http'
import type {
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  TransactionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NumberString,
} from '../../types'
import { CashoutOptions } from '../../types'

const chequebookEndpoint = '/chequebook'

/**
 * Get the address of the chequebook contract used
 *
 * @param url Bee debug url
 */
export async function getChequebookAddress(ky: Ky): Promise<ChequebookAddressResponse> {
  const response = await http<ChequebookAddressResponse>({
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
export async function getChequebookBalance(ky: Ky): Promise<ChequebookBalanceResponse> {
  const response = await http<ChequebookBalanceResponse>({
    url: url + chequebookEndpoint + '/balance',
    responseType: 'json',
  })

  return response.data
}

/**
 * Get last cashout action for the peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 */
export async function getLastCashoutAction(ky: Ky, peer: string): Promise<LastCashoutActionResponse> {
  const response = await http<LastCashoutActionResponse>({
    url: url + chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
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
export async function cashoutLastCheque(ky: Ky, peer: string, options?: CashoutOptions): Promise<string> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.gasLimit) {
    headers['gas-limit'] = options.gasLimit.toString()
  }

  const response = await http<TransactionResponse>({
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
export async function getLastChequesForPeer(ky: Ky, peer: string): Promise<LastChequesForPeerResponse> {
  const response = await http<LastChequesForPeerResponse>({
    url: url + chequebookEndpoint + `/cheque/${peer}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get last cheques for all peers
 *
 * @param url   Bee debug url
 */
export async function getLastCheques(ky: Ky): Promise<LastChequesResponse> {
  const response = await http<LastChequesResponse>({
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
export async function depositTokens(ky: Ky, amount: number | NumberString, gasPrice?: NumberString): Promise<string> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<TransactionResponse>({
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
export async function withdrawTokens(ky: Ky, amount: number | NumberString, gasPrice?: NumberString): Promise<string> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<TransactionResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return response.data.transactionHash
}
