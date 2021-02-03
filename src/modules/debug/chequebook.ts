import { safeAxios } from '../../utils/safeAxios'

const chequebookEndpoint = '/chequebook'

interface ChequebookAddressResponse {
  // see this issue regarding the naming https://github.com/ethersphere/bee/issues/1078
  chequebookaddress: string
}

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

interface ChequebookBalanceResponse {
  totalBalance: number
  availableBalance: number
}

/**
 * Get the balance of the chequebook
 *
 * @param url Bee debug url
 */
export async function getChequeubookBalance(url: string): Promise<ChequebookBalanceResponse> {
  const response = await safeAxios<ChequebookBalanceResponse>({
    url: url + chequebookEndpoint + '/balance',
    responseType: 'json',
  })

  return response.data
}

interface CashoutResult {
  recipient: string
  lastPayout: number
  bounced: boolean
}

interface LastCashoutActionResponse {
  peer: string
  chequebook: string
  cumulativePayout: number
  beneficiary: string
  transactionHash: string
  result: CashoutResult
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

interface CashoutResponse {
  transactionHash: string
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

interface Cheque {
  beneficiary: string
  chequebook: string
  payout: number
}

interface LastChequesForPeerResponse {
  peer: string
  lastreceived: Cheque
  lastsent: Cheque
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

interface LastChequesResponse {
  lastcheques: LastChequesForPeerResponse[]
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

interface DepositTokensResponse {
  transactionHash: string
}

/**
 * Deposit tokens from overlay address into chequebook
 *
 * @param url     Bee debug url
 * @param amount  Amount of tokens to deposit
 */
export async function depositTokens(url: string, amount: number): Promise<DepositTokensResponse> {
  const response = await safeAxios<DepositTokensResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/deposit',
    responseType: 'json',
    params: { amount },
  })

  return response.data
}

interface WithdrawTokensResponse {
  transactionHash: string
}

/**
 * Withdraw tokens from the chequebook to the overlay address
 *
 * @param url     Bee debug url
 * @param amount  Amount of tokens to withdraw
 */
export async function withdrawTokens(url: string, amount: number): Promise<WithdrawTokensResponse> {
  const response = await safeAxios<WithdrawTokensResponse>({
    method: 'post',
    url: url + chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount },
  })

  return response.data
}
