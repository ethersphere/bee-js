import type {
  BeeRequestOptions,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NumberString,
  TransactionOptions,
} from '../../types'
import {
  GetChequebookAddressResponse,
  GetChequebookBalanceResponse,
  GetLastCashoutActionResponse,
  GetLastChequesForPeerResponse,
  GetLastChequesResponse,
  TransactionHashResponse,
} from '../../types/schema/chequebook'
import { prepareRequestHeaders } from '../../utils/headers'
import { http } from '../../utils/http'
import { PeerAddress, TransactionId } from '../../utils/typed-bytes'

const chequebookEndpoint = 'chequebook'

/**
 * Get the address of the chequebook contract used
 *
 * @param requestOptions Options for making requests
 */
export async function getChequebookAddress(requestOptions: BeeRequestOptions): Promise<ChequebookAddressResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + '/address',
    responseType: 'json',
  })

  return GetChequebookAddressResponse.parse(response.data)
}

/**
 * Get the balance of the chequebook
 *
 * @param requestOptions Options for making requests
 */
export async function getChequebookBalance(requestOptions: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + '/balance',
    responseType: 'json',
  })

  return GetChequebookBalanceResponse.parse(response.data)
}

/**
 * Get last cashout action for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastCashoutAction(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<LastCashoutActionResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
  })

  return GetLastCashoutActionResponse.parse(response.data)
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
  peer: PeerAddress,
  options?: TransactionOptions,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
    headers: prepareRequestHeaders(null, options),
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}

/**
 * Get last cheques for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastChequesForPeer(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<LastChequesForPeerResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + `/cheque/${peer}`,
    responseType: 'json',
  })

  return GetLastChequesForPeerResponse.parse(response.data)
}

/**
 * Get last cheques for all peers
 *
 * @param requestOptions Options for making requests
 */
export async function getLastCheques(requestOptions: BeeRequestOptions): Promise<LastChequesResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + '/cheque',
    responseType: 'json',
  })

  return GetLastChequesResponse.parse(response.data)
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
  amount: NumberString | string | bigint,
  gasPrice?: NumberString | string | bigint,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + '/deposit',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return TransactionHashResponse.parse(response.data).transactionHash
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
  amount: NumberString | string | bigint,
  gasPrice?: NumberString | string | bigint,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}
