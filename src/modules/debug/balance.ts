import { http } from '../../utils/http'
import type { PeerBalance, BalanceResponse, Ky } from '../../types'

const balancesEndpoint = 'balances'
const consumedEndpoint = 'consumed'

/**
 * Get the balances with all known peers including prepaid services
 *
 * @param ky Ky debug instance
 */
export async function getAllBalances(ky: Ky): Promise<BalanceResponse> {
  const response = await http<BalanceResponse>(ky, {
    path: balancesEndpoint,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the balances with a specific peer including prepaid services
 *
 * @param ky Ky debug instance
 * @param address Swarm address of peer
 */
export async function getPeerBalance(ky: Ky, address: string): Promise<PeerBalance> {
  const response = await http<PeerBalance>(ky, {
    path: `${balancesEndpoint}/${address}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the past due consumption balances with all known peers
 *
 * @param ky Ky debug instance
 */
export async function getPastDueConsumptionBalances(ky: Ky): Promise<BalanceResponse> {
  const response = await http<BalanceResponse>(ky, {
    path: consumedEndpoint,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get the past due consumption balance with a specific peer
 *
 * @param ky Ky debug instance
 * @param address Swarm address of peer
 */
export async function getPastDueConsumptionPeerBalance(ky: Ky, address: string): Promise<PeerBalance> {
  const response = await http<PeerBalance>(ky, {
    path: `${consumedEndpoint}/${address}`,
    responseType: 'json',
  })

  return response.data
}
