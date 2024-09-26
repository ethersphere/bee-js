import { BeeRequestOptions, ChainState, ReserveState, WalletBalance } from '../../types'
import { http } from '../../utils/http'

const RESERVE_STATE_ENDPOINT = 'reservestate'
const WALLET_ENDPOINT = 'wallet'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Get state of reserve
 *
 * @param requestOptions Options for making requests
 */
export async function getReserveState(requestOptions: BeeRequestOptions): Promise<ReserveState> {
  const response = await http<ReserveState>(requestOptions, {
    method: 'get',
    url: `${RESERVE_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get state of reserve
 *
 * @param requestOptions Options for making requests
 */
export async function getChainState(requestOptions: BeeRequestOptions): Promise<ChainState> {
  const response = await http<ChainState>(requestOptions, {
    method: 'get',
    url: `${CHAIN_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get wallet balances for xDai and BZZ of the node
 *
 * @param requestOptions Options for making requests
 */
export async function getWalletBalance(requestOptions: BeeRequestOptions): Promise<WalletBalance> {
  const response = await http<WalletBalance>(requestOptions, {
    method: 'get',
    url: `${WALLET_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data
}
