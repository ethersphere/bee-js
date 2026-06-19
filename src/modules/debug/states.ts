import { Types } from 'cafe-utility'
import { BeeRequestOptions, ChainState, ReserveState, WalletBalance } from '../../types'
import { GetChainStateResponse, GetReserveStateResponse } from '../../types/schema/states'
import { http } from '../../utils/http'
import { BZZ, DAI } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
import { EthAddress, TransactionId } from '../../utils/typed-bytes'

const RESERVE_STATE_ENDPOINT = 'reservestate'
const WALLET_ENDPOINT = 'wallet'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Get state of reserve
 *
 * @param requestOptions Options for making requests
 */
export async function getReserveState(requestOptions: BeeRequestOptions): Promise<ReserveState> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${RESERVE_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return GetReserveStateResponse.parse(response.data)
}

/**
 * Get state of reserve
 *
 * @param requestOptions Options for making requests
 */
export async function getChainState(requestOptions: BeeRequestOptions): Promise<ChainState> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${CHAIN_STATE_ENDPOINT}`,
    responseType: 'json',
  })

  return GetChainStateResponse.parse(response.data)
}

/**
 * Get wallet balances for xDai and BZZ of the node
 *
 * @param requestOptions Options for making requests
 */
export async function getWalletBalance(requestOptions: BeeRequestOptions): Promise<WalletBalance> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${WALLET_ENDPOINT}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    bzzBalance: BZZ.fromPLUR(asNumberString(body.bzzBalance, { name: 'bzzBalance' })),
    nativeTokenBalance: DAI.fromWei(asNumberString(body.nativeTokenBalance, { name: 'nativeTokenBalance' })),
    chainID: Types.asNumber(body.chainID, { name: 'chainID' }),
    chequebookContractAddress: Types.asString(body.chequebookContractAddress, { name: 'chequebookContractAddress' }),
    walletAddress: Types.asString(body.walletAddress, { name: 'walletAddress' }),
  }
}

export async function withdrawBZZ(
  requestOptions: BeeRequestOptions,
  amount: BZZ,
  address: EthAddress,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${WALLET_ENDPOINT}/withdraw/bzz`,
    responseType: 'json',
    params: { amount: amount.toPLURString(), address: address.toHex() },
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
}

export async function withdrawDAI(
  requestOptions: BeeRequestOptions,
  amount: DAI,
  address: EthAddress,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${WALLET_ENDPOINT}/withdraw/nativetoken`,
    responseType: 'json',
    params: { amount: amount.toWeiString(), address: address.toHex() },
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
}
