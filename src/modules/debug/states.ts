import { http } from '../../utils/http'
import { ChainState, ReserveState } from '../../types'

const RESERVE_STATE_ENDPOINT = '/reservestate'
const CHAIN_STATE_ENDPOINT = '/chainstate'

/**
 * Get state of reserve
 *
 * @param url Bee debug URL
 */
export async function getReserveState(ky: Ky): Promise<ReserveState> {
  const response = await http<ReserveState>({
    method: 'get',
    url: `${url}${RESERVE_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get state of reserve
 *
 * @param url Bee debug URL
 */
export async function getChainState(ky: Ky): Promise<ChainState> {
  const response = await http<ChainState>({
    method: 'get',
    url: `${url}${CHAIN_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}
