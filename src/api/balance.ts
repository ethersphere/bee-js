import { PeerAddress } from '@ethersphere/core-sdk'
import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../types/index.js'
import { GetAllBalancesResponse, GetPeerBalanceResponse } from '../types/schema/balance.js'
import { http } from '../utils/http.js'

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
