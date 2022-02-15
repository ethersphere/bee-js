import { http } from '../../utils/http.js'

import type { ChainState, Ky, ReserveState } from '../../types/index.js'

const RESERVE_STATE_ENDPOINT = 'reservestate'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Get state of reserve
 *
 * @param ky Ky debug instance
 */
export async function getReserveState(ky: Ky): Promise<ReserveState> {
  const response = await http<ReserveState>(ky, {
    method: 'get',
    path: `${RESERVE_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get state of reserve
 *
 * @param ky Ky debug instance
 */
export async function getChainState(ky: Ky): Promise<ChainState> {
  const response = await http<ChainState>(ky, {
    method: 'get',
    path: `${CHAIN_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}
