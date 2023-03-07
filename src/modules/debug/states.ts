import { BeeRequestOptions, ChainState, ReserveState, WalletBalance } from '../../types'
import { http } from '../../utils/http'

const RESERVE_STATE_ENDPOINT = 'reservestate'
const WALLET_ENDPOINT = 'wallet'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Get state of reserve
 *
 * @param kyOptions Ky Options for making requests
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
 * @param kyOptions Ky Options for making requests
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
 * @param kyOptions Ky Options for making requests
 */
export async function getWalletBalance(requestOptions: BeeRequestOptions): Promise<WalletBalance> {
  const response = await http<WalletBalance>(requestOptions, {
    method: 'get',
    url: `${WALLET_ENDPOINT}`,
    responseType: 'json',
  })

  return mapWalletProperties(response.data)
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
