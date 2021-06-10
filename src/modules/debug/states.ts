import { safeAxios } from '../../utils/safe-axios'
import { ChainState, ReserveState } from '../../types'

const RESERVE_STATE_ENDPOINT = '/reservestate'
const CHAIN_STATE_ENDPOINT = '/chainstate'

/**
 * Get state of reserve
 *
 * @param url Bee debug URL
 */
export async function getReserveState(url: string): Promise<ReserveState> {
  const response = await safeAxios<ReserveState>({
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
export async function getChainState(url: string): Promise<ChainState> {
  const response = await safeAxios<ChainState>({
    method: 'get',
    url: `${url}${CHAIN_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}
