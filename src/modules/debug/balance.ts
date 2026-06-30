import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../../types'
import { GetAllBalancesResponse, GetPeerBalanceResponse } from '../../types/schema/balance'
import { http } from '../../utils/http'
import { PeerAddress } from '../../utils/typed-bytes'

const balancesEndpoint = 'balances'
const consumedEndpoint = 'consumed'

/**
 * Get the balances with all known peers including prepaid services
 *
 * @param requestOptions Options for making requests
 */
export async function getAllBalances(requestOptions: BeeRequestOptions): Promise<BalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: balancesEndpoint,
    responseType: 'json',
  })

  return GetAllBalancesResponse.parse(response.data)
}

/**
 * Get the balances with a specific peer including prepaid services
 *
 * @param requestOptions Options for making requests
 * @param address Swarm address of peer
 */
export async function getPeerBalance(requestOptions: BeeRequestOptions, address: PeerAddress): Promise<PeerBalance> {
  const response = await http<unknown>(requestOptions, {
    url: `${balancesEndpoint}/${address}`,
    responseType: 'json',
  })

  return GetPeerBalanceResponse.parse(response.data)
}

/**
 * Get the past due consumption balances with all known peers
 *
 * @param requestOptions Options for making requests
 */
export async function getPastDueConsumptionBalances(requestOptions: BeeRequestOptions): Promise<BalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: consumedEndpoint,
    responseType: 'json',
  })

  return GetAllBalancesResponse.parse(response.data)
}

/**
 * Get the past due consumption balance with a specific peer
 *
 * @param requestOptions Options for making requests
 * @param address Swarm address of peer
 */
export async function getPastDueConsumptionPeerBalance(
  requestOptions: BeeRequestOptions,
  address: PeerAddress,
): Promise<PeerBalance> {
  const response = await http<unknown>(requestOptions, {
    url: `${consumedEndpoint}/${address}`,
    responseType: 'json',
  })

  return GetPeerBalanceResponse.parse(response.data)
}
