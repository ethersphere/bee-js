import type { BeeRequestOptions, TransactionOptions } from '../types'
import { GetStakeResponse, GetWithdrawableStakeResponse, TxHashResponse } from '../types/schema/stake'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { BZZ } from '../utils/tokens'
import { TransactionId } from '../utils/typed-bytes'

const STAKE_ENDPOINT = 'stake'

/**
 * Raw HTTP calls for the `/stake` endpoint.
 */

export async function getStake(requestOptions: BeeRequestOptions): Promise<BZZ> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: STAKE_ENDPOINT,
  })

  return GetStakeResponse.parse(response.data).stakedAmount
}

export async function getWithdrawableStake(requestOptions: BeeRequestOptions): Promise<BZZ> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/withdrawable`,
  })

  return GetWithdrawableStakeResponse.parse(response.data).withdrawableAmount
}

export async function depositStake(
  requestOptions: BeeRequestOptions,
  amountString: string,
  options?: TransactionOptions,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/${amountString}`,
    headers: prepareRequestHeaders(null, options),
  })

  return TxHashResponse.parse(response.data).txHash
}

export async function withdrawSurplusStake(requestOptions: BeeRequestOptions): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/withdrawable`,
  })

  return TxHashResponse.parse(response.data).txHash
}

export async function migrateStake(requestOptions: BeeRequestOptions): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    responseType: 'json',
    url: STAKE_ENDPOINT,
  })

  return TxHashResponse.parse(response.data).txHash
}
