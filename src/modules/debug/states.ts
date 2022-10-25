import { http } from '../../utils/http'
import { ChainState, Ky, ReserveState, WalletBalance } from '../../types'

const RESERVE_STATE_ENDPOINT = 'reservestate'
const WALLET_ENDPOINT = 'wallet'
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

  return response.parsedData
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

  return response.parsedData
}

/**
 * Get wallet balances for xDai and BZZ of the node
 *
 * @param ky Ky debug instance
 */
export async function getWalletBalance(ky: Ky): Promise<WalletBalance> {
  const response = await http<WalletBalance>(ky, {
    method: 'get',
    path: `${WALLET_ENDPOINT}`,
    responseType: 'json',
  })

  return response.parsedData
}
