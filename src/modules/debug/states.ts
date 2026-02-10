import { Types } from 'cafe-utility'
import { BeeRequestOptions, ChainState, ReserveState, WalletBalance } from '../../types'
import { http } from '../../utils/http'
import { BZZ, DAI } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
import { EthAddress, TransactionId } from '../../utils/typed-bytes'
import { normalizeCurrentPrice } from '../../utils/workaround'

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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    commitment: Types.asNumber(body.commitment, { name: 'commitment' }),
    radius: Types.asNumber(body.radius, { name: 'radius' }),
    storageRadius: Types.asNumber(body.storageRadius, { name: 'storageRadius' }),
    reserveCapacityDoubling: Types.asNumber(body.reserveCapacityDoubling, { name: 'reserveCapacityDoubling' }),
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    block: Types.asNumber(body.block, { name: 'block' }),
    chainTip: Types.asNumber(body.chainTip, { name: 'chainTip' }),
    totalAmount: asNumberString(body.totalAmount, { name: 'totalAmount' }),
    currentPrice: normalizeCurrentPrice(Types.asNumber(body.currentPrice, { name: 'currentPrice' })),
  }
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
