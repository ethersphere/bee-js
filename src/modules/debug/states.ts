import { http } from '../../utils/http'
import { ChainState, ReserveState, WalletBalance } from '../../types'
import type { Options as KyOptions } from 'ky'

const RESERVE_STATE_ENDPOINT = 'reservestate'
const WALLET_ENDPOINT = 'wallet'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Get state of reserve
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getReserveState(kyOptions: KyOptions): Promise<ReserveState> {
  const response = await http<ReserveState>(kyOptions, {
    method: 'get',
    path: `${RESERVE_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Get state of reserve
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getChainState(kyOptions: KyOptions): Promise<ChainState> {
  const response = await http<ChainState>(kyOptions, {
    method: 'get',
    path: `${CHAIN_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Get wallet balances for xDai and BZZ of the node
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getWalletBalance(kyOptions: KyOptions): Promise<WalletBalance> {
  const response = await http<WalletBalance>(kyOptions, {
    method: 'get',
    path: `${WALLET_ENDPOINT}`,
    responseType: 'json',
  })

  return mapWalletProperties(response.parseData)
}

/**
 * TODO: Remove on next break
 * @param data
 */
function mapWalletProperties(data: WalletBalance): WalletBalance {
  return {
    // @ts-ignore: Needed for backward compatibility mapping
    bzz: data.bzzBalance,
    // @ts-ignore: Needed for backward compatibility mapping
    xDai: data.nativeTokenBalance,
    // @ts-ignore: Needed for backward compatibility mapping
    contractAddress: data.chequebookContractAddress,
    ...data,
  }
}
