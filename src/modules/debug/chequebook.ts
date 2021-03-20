import { safeAxios } from '../../utils/safeAxios'
import {
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  CashoutResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  DepositTokensResponse,
  WithdrawTokensResponse,
} from '../../types'
import { assertInteger } from '../../utils/type'

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
  })

  return response.data
}

/**
 * Cashout the last cheque for the peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 */
export async function cashoutLastCheque(url: string, peer: string): Promise<CashoutResponse> {
  const response = await safeAxios<LastCashoutActionResponse>({
    method: 'post',
    url: url + chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
  })

  return response.data
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
 * @param url     Bee debug url
 * @param amount  Amount of tokens to deposit
 */
export async function depositTokens(url: string, amount: number | BigInt): Promise<DepositTokensResponse> {
  assertInteger(amount)

  if (amount < 0) throw new TypeError('must be positive number')

  const response = await safeAxios<DepositTokensResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/deposit',
    responseType: 'json',
    params: { amount },
  })

  return response.data
}

/**
 * Withdraw tokens from the chequebook to the overlay address
 *
 * @param url     Bee debug url
 * @param amount  Amount of tokens to withdraw
 */
export async function withdrawTokens(url: string, amount: number | BigInt): Promise<WithdrawTokensResponse> {
  assertInteger(amount)

  if (amount < 0) throw new TypeError('must be positive number')

  const response = await safeAxios<WithdrawTokensResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount },
  })

  return response.data
}
