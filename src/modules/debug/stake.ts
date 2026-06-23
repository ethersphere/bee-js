import { BeeRequestOptions, NumberString, RedistributionState, TransactionOptions } from '../../types'
import {
  GetRedistributionStateResponse,
  GetStakeResponse,
  GetWithdrawableStakeResponse,
  TxHashResponse,
} from '../../types/schema/stake'
import { prepareRequestHeaders } from '../../utils/headers'
import { http } from '../../utils/http'
import { BZZ } from '../../utils/tokens'
import { TransactionId } from '../../utils/typed-bytes'

const STAKE_ENDPOINT = 'stake'
const REDISTRIBUTION_ENDPOINT = 'redistributionstate'

/**
 * Gets the amount of staked BZZ
 *
 * @param requestOptions Options for making requests
 */
export async function getStake(requestOptions: BeeRequestOptions): Promise<BZZ> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}`,
  })

  return GetStakeResponse.parse(response.data).stakedAmount
}

/**
 * Gets the amount of withdrawable staked BZZ
 *
 * @param requestOptions Options for making requests
 */
export async function getWithdrawableStake(requestOptions: BeeRequestOptions): Promise<BZZ> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/withdrawable`,
  })

  return GetWithdrawableStakeResponse.parse(response.data).withdrawableAmount
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

/**
 * Stake given amount of tokens.
 *
 * @param requestOptions Options for making requests
 * @param amount
 */
export async function stake(
  requestOptions: BeeRequestOptions,
  amount: NumberString | string | bigint,
  options?: TransactionOptions,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/${amount}`,
    headers: prepareRequestHeaders(null, options),
  })

  return TxHashResponse.parse(response.data).txHash
}

/**
 * Get current status of node in redistribution game
 *
 * @param requestOptions Options for making requests
 */
export async function getRedistributionState(requestOptions: BeeRequestOptions): Promise<RedistributionState> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: REDISTRIBUTION_ENDPOINT,
  })

  return GetRedistributionStateResponse.parse(response.data)
}
