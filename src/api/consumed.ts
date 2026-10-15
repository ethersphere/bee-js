import { PeerAddress } from '@ethersphere/core-sdk'
import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../types'
import { GetAllBalancesResponse, GetPeerBalanceResponse } from '../types/schema/balance'
import { http } from '../utils/http'

const consumedEndpoint = 'consumed'

/**
 * Raw HTTP calls for the `/consumed` endpoint.
 */

export async function getPastDueConsumptionBalances(requestOptions: BeeRequestOptions): Promise<BalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: consumedEndpoint,
    responseType: 'json',
  })

  return GetAllBalancesResponse.parse(response.data)
}

export async function getPastDueConsumptionPeerBalance(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<PeerBalance> {
  const response = await http<unknown>(requestOptions, {
    url: `${consumedEndpoint}/${peer}`,
    responseType: 'json',
  })

  return GetPeerBalanceResponse.parse(response.data)
}
