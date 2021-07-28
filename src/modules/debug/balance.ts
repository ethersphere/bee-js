import { http } from '../../utils/http'
import { PeerBalance, BalanceResponse } from '../../types'

const balancesEndpoint = '/balances'
const consumedEndpoint = '/consumed'

/**
 * Get the balances with all known peers including prepaid services
 *
 * @param url Bee debug url
 */
export async function getAllBalances(ky: Ky): Promise<BalanceResponse> {
  const response = await http<BalanceResponse>({
    url: url + balancesEndpoint,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the balances with a specific peer including prepaid services
 *
 * @param url     Bee debug url
 * @param address Swarm address of peer
 */
export async function getPeerBalance(ky: Ky, address: string): Promise<PeerBalance> {
  const response = await http<PeerBalance>({
    url: url + `${balancesEndpoint}/${address}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the past due consumption balances with all known peers
 *
 * @param url Bee debug url
 */
export async function getPastDueConsumptionBalances(ky: Ky): Promise<BalanceResponse> {
  const response = await http<BalanceResponse>({
    url: url + consumedEndpoint,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the past due consumption balance with a specific peer
 *
 * @param url     Bee debug url
 * @param address Swarm address of peer
 */
export async function getPastDueConsumptionPeerBalance(ky: Ky, address: string): Promise<PeerBalance> {
  const response = await http<PeerBalance>({
    url: url + `${consumedEndpoint}/${address}`,
    responseType: 'json',
  })

  return response.data
}
