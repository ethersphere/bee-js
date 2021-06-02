import { safeAxios } from '../../utils/safe-axios'
import { PeerBalance, BalanceResponse } from '../../types'

const balancesEndpoint = '/balances'
const consumedEndpoint = '/consumed'

/**
 * Get the balances with all known peers including prepaid services
 *
 * @param url Bee debug url
 */
export async function getAllBalances(url: string): Promise<BalanceResponse> {
  const response = await safeAxios<BalanceResponse>({
    url: url + balancesEndpoint,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Get the balances with a specific peer including prepaid services
 *
 * @param url     Bee debug url
 * @param address Swarm address of peer
 */
export async function getPeerBalance(url: string, address: string): Promise<PeerBalance> {
  const response = await safeAxios<PeerBalance>({
    url: url + `${balancesEndpoint}/${address}`,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Get the past due consumption balances with all known peers
 *
 * @param url Bee debug url
 */
export async function getPastDueConsumptionBalances(url: string): Promise<BalanceResponse> {
  const response = await safeAxios<BalanceResponse>({
    url: url + consumedEndpoint,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Get the past due consumption balance with a specific peer
 *
 * @param url     Bee debug url
 * @param address Swarm address of peer
 */
export async function getPastDueConsumptionPeerBalance(url: string, address: string): Promise<PeerBalance> {
  const response = await safeAxios<PeerBalance>({
    url: url + `${consumedEndpoint}/${address}`,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}
