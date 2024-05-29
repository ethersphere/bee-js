import type {
  BeeRequestOptions,
  CashoutOptions,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NumberString,
  TransactionHash,
  TransactionResponse,
} from '../../types'
import { http } from '../../utils/http'

const chequebookEndpoint = 'chequebook'

/**
 * Get the address of the chequebook contract used
 *
 * @param requestOptions Options for making requests
 */
export async function getChequebookAddress(requestOptions: BeeRequestOptions): Promise<ChequebookAddressResponse> {
  const response = await http<ChequebookAddressResponse>(requestOptions, {
    url: chequebookEndpoint + '/address',
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the balance of the chequebook
 *
 * @param requestOptions Options for making requests
 */
export async function getChequebookBalance(requestOptions: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
  const response = await http<ChequebookBalanceResponse>(requestOptions, {
    url: chequebookEndpoint + '/balance',
    responseType: 'json',
  })

  return response.data
}

/**
 * Get last cashout action for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastCashoutAction(
  requestOptions: BeeRequestOptions,
  peer: string,
): Promise<LastCashoutActionResponse> {
  const response = await http<LastCashoutActionResponse>(requestOptions, {
    url: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Cashout the last cheque for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 * @param options
 */
export async function cashoutLastCheque(
  requestOptions: BeeRequestOptions,
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

  const response = await http<TransactionResponse>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
    headers,
  })

  return response.data.transactionHash
}

/**
 * Get last cheques for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastChequesForPeer(
  requestOptions: BeeRequestOptions,
  peer: string,
): Promise<LastChequesForPeerResponse> {
  const response = await http<LastChequesForPeerResponse>(requestOptions, {
    url: chequebookEndpoint + `/cheque/${peer}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get last cheques for all peers
 *
 * @param requestOptions Options for making requests
 */
export async function getLastCheques(requestOptions: BeeRequestOptions): Promise<LastChequesResponse> {
  const response = await http<LastChequesResponse>(requestOptions, {
    url: chequebookEndpoint + '/cheque',
    responseType: 'json',
  })

  return response.data
}

/**
 * Deposit tokens from overlay address into chequebook
 *
 * @param requestOptions Options for making requests
 * @param amount   Amount of tokens to deposit
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function depositTokens(
  requestOptions: BeeRequestOptions,
  amount: number | NumberString,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<TransactionResponse>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + '/deposit',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return response.data.transactionHash
}

/**
 * Withdraw tokens from the chequebook to the overlay address
 *
 * @param requestOptions Options for making requests
 * @param amount   Amount of tokens to withdraw
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function withdrawTokens(
  requestOptions: BeeRequestOptions,
  amount: number | NumberString,
  gasPrice?: NumberString,
): Promise<TransactionHash> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<TransactionResponse>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return response.data.transactionHash
}
