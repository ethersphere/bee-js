import type {
  BeeRequestOptions,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  TransactionOptions,
} from '../types'
import {
  GetChequebookAddressResponse,
  GetChequebookBalanceResponse,
  GetLastCashoutActionResponse,
  GetLastChequesForPeerResponse,
  GetLastChequesResponse,
  TransactionHashResponse,
} from '../types/schema/chequebook'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { PeerAddress, TransactionId } from '../utils/typed-bytes'

const chequebookEndpoint = 'chequebook'

/**
 * Raw HTTP calls for the `/chequebook` endpoint (chequebook + cheque operations).
 */

/** Gets the address of the deployed chequebook. */
export async function getChequebookAddress(requestOptions: BeeRequestOptions): Promise<ChequebookAddressResponse> {
  const response = await http<unknown>(requestOptions, {
    url: `${chequebookEndpoint}/address`,
    responseType: 'json',
  })

  return GetChequebookAddressResponse.parse(response.data)
}

/** Gets the balance of the chequebook. */
export async function getChequebookBalance(requestOptions: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: `${chequebookEndpoint}/balance`,
    responseType: 'json',
  })

  return GetChequebookBalanceResponse.parse(response.data)
}

/** Deposits tokens from the node wallet into the chequebook. */
export async function depositTokens(
  requestOptions: BeeRequestOptions,
  amount: string,
  gasPrice?: string,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${chequebookEndpoint}/deposit`,
    responseType: 'json',
    params: { amount },
    headers,
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}

/** Withdraws tokens from the chequebook to the node wallet. */
export async function withdrawTokens(
  requestOptions: BeeRequestOptions,
  amount: string,
  gasPrice?: string,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${chequebookEndpoint}/withdraw`,
    responseType: 'json',
    params: { amount },
    headers,
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}

/** Gets the last cheques for all peers. */
export async function getLastCheques(requestOptions: BeeRequestOptions): Promise<LastChequesResponse> {
  const response = await http<unknown>(requestOptions, {
    url: `${chequebookEndpoint}/cheque`,
    responseType: 'json',
  })

  return GetLastChequesResponse.parse(response.data)
}

/** Gets the last cheques for a specific peer. */
export async function getLastChequesForPeer(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<LastChequesForPeerResponse> {
  const response = await http<unknown>(requestOptions, {
    url: `${chequebookEndpoint}/cheque/${peer}`,
    responseType: 'json',
  })

  return GetLastChequesForPeerResponse.parse(response.data)
}

/** Gets the last cashout action for a specific peer. */
export async function getLastCashoutAction(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<LastCashoutActionResponse> {
  const response = await http<unknown>(requestOptions, {
    url: `${chequebookEndpoint}/cashout/${peer}`,
    responseType: 'json',
  })

  return GetLastCashoutActionResponse.parse(response.data)
}

/** Cashes out the last cheque for a specific peer. */
export async function cashoutLastCheque(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
  options?: TransactionOptions,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${chequebookEndpoint}/cashout/${peer}`,
    responseType: 'json',
    headers: prepareRequestHeaders(null, options),
  })

  return TransactionHashResponse.parse(response.data).transactionHash
}
