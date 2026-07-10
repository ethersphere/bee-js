import type { BeeRequestOptions, WalletBalance } from '../types'
import { GetWalletBalanceResponse, WithdrawResponse } from '../types/schema/states'
import { http } from '../utils/http'
import { BZZ, DAI } from '../utils/tokens'
import { EthAddress, TransactionId } from '../utils/typed-bytes'

const WALLET_ENDPOINT = 'wallet'

/**
 * Raw HTTP calls for the `/wallet` endpoint.
 */

export async function getWalletBalance(requestOptions: BeeRequestOptions): Promise<WalletBalance> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: WALLET_ENDPOINT,
    responseType: 'json',
  })

  return GetWalletBalanceResponse.parse(response.data)
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

  return WithdrawResponse.parse(response.data).transactionHash
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

  return WithdrawResponse.parse(response.data).transactionHash
}
