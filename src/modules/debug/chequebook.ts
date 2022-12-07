import { http } from '../../utils/http'
import type {
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  TransactionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NumberString,
  CashoutOptions,
  TransactionHash,
} from '../../types'
import type { Options as KyOptions } from 'ky'

const chequebookEndpoint = 'chequebook'

/**
 * Get the address of the chequebook contract used
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getChequebookAddress(kyOptions: KyOptions): Promise<ChequebookAddressResponse> {
  const response = await http<ChequebookAddressResponse>(kyOptions, {
    path: chequebookEndpoint + '/address',
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Get the balance of the chequebook
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getChequebookBalance(kyOptions: KyOptions): Promise<ChequebookBalanceResponse> {
  const response = await http<ChequebookBalanceResponse>(kyOptions, {
    path: chequebookEndpoint + '/balance',
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Get last cashout action for the peer
 *
 * @param kyOptions Ky Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastCashoutAction(kyOptions: KyOptions, peer: string): Promise<LastCashoutActionResponse> {
  const response = await http<LastCashoutActionResponse>(kyOptions, {
    path: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Cashout the last cheque for the peer
 *
 * @param kyOptions Ky Options for making requests
 * @param peer  Swarm address of peer
 * @param options
 */
export async function cashoutLastCheque(
  kyOptions: KyOptions,
  peer: string,
  options?: CashoutOptions,
): Promise<TransactionHash> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.gasLimit) {
    headers['gas-limit'] = options.gasLimit.toString()
  }

  const response = await http<TransactionResponse>(kyOptions, {
    method: 'post',
    path: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
    headers,
  })

  return response.parseData.transactionHash
}

/**
 * Get last cheques for the peer
 *
 * @param kyOptions Ky Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastChequesForPeer(kyOptions: KyOptions, peer: string): Promise<LastChequesForPeerResponse> {
  const response = await http<LastChequesForPeerResponse>(kyOptions, {
    path: chequebookEndpoint + `/cheque/${peer}`,
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Get last cheques for all peers
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getLastCheques(kyOptions: KyOptions): Promise<LastChequesResponse> {
  const response = await http<LastChequesResponse>(kyOptions, {
    path: chequebookEndpoint + '/cheque',
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Deposit tokens from overlay address into chequebook
 *
 * @param kyOptions Ky Options for making requests
 * @param amount   Amount of tokens to deposit
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function depositTokens(
  kyOptions: KyOptions,
  amount: number | NumberString,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<TransactionResponse>(kyOptions, {
    method: 'post',
    path: chequebookEndpoint + '/deposit',
    responseType: 'json',
    searchParams: { amount: amount.toString(10) },
    headers,
  })

  return response.parseData.transactionHash
}

/**
 * Withdraw tokens from the chequebook to the overlay address
 *
 * @param kyOptions Ky Options for making requests
 * @param amount   Amount of tokens to withdraw
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function withdrawTokens(
  kyOptions: KyOptions,
  amount: number | NumberString,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<TransactionResponse>(kyOptions, {
    method: 'post',
    path: chequebookEndpoint + '/withdraw',
    responseType: 'json',
    searchParams: { amount: amount.toString(10) },
    headers,
  })

  return response.parseData.transactionHash
}
