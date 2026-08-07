import { PeerAddress } from 'swarm-core'
import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../types'
import { GetAllBalancesResponse, GetPeerBalanceResponse } from '../types/schema/balance'
import { http } from '../utils/http'

const balancesEndpoint = 'balances'

/**
 * Raw HTTP calls for the `/balances` endpoint.
 */

export async function getBalances(requestOptions: BeeRequestOptions): Promise<BalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: balancesEndpoint,
    responseType: 'json',
  })

  return GetAllBalancesResponse.parse(response.data)
}

export async function getPeerBalance(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<PeerBalance> {
  const response = await http<unknown>(requestOptions, {
    url: `${balancesEndpoint}/${peer}`,
    responseType: 'json',
  })

  return GetPeerBalanceResponse.parse(response.data)
}
