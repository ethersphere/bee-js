import { http } from '../../utils/http'
import type { PeerBalance, BalanceResponse } from '../../types'

// @ts-ignore: Needed TS otherwise complains about importing ESM package in CJS even though they are just typings
import type { Options as KyOptions } from 'ky'

const balancesEndpoint = 'balances'
const consumedEndpoint = 'consumed'

/**
 * Get the balances with all known peers including prepaid services
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getAllBalances(kyOptions: KyOptions): Promise<BalanceResponse> {
  const response = await http<BalanceResponse>(kyOptions, {
    path: balancesEndpoint,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Get the balances with a specific peer including prepaid services
 *
 * @param kyOptions Ky Options for making requests
 * @param address Swarm address of peer
 */
export async function getPeerBalance(kyOptions: KyOptions, address: string): Promise<PeerBalance> {
  const response = await http<PeerBalance>(kyOptions, {
    path: `${balancesEndpoint}/${address}`,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Get the past due consumption balances with all known peers
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getPastDueConsumptionBalances(kyOptions: KyOptions): Promise<BalanceResponse> {
  const response = await http<BalanceResponse>(kyOptions, {
    path: consumedEndpoint,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Get the past due consumption balance with a specific peer
 *
 * @param kyOptions Ky Options for making requests
 * @param address Swarm address of peer
 */
export async function getPastDueConsumptionPeerBalance(kyOptions: KyOptions, address: string): Promise<PeerBalance> {
  const response = await http<PeerBalance>(kyOptions, {
    path: `${consumedEndpoint}/${address}`,
    responseType: 'json',
  })

  return response.parsedData
}
