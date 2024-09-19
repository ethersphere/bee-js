import {
  BeeGenericResponse,
  BeeRequestOptions,
  NumberString,
  RedistributionState,
  TransactionOptions,
} from '../../types'
import { http } from '../../utils/http'

const STAKE_ENDPOINT = 'stake'
const REDISTRIBUTION_ENDPOINT = 'redistributionstate'

interface GetStake {
  stakedAmount: NumberString
}

/**
 * Gets the staked amount
 *
 * @param requestOptions Options for making requests
 */
export async function getStake(requestOptions: BeeRequestOptions): Promise<NumberString> {
  const response = await http<GetStake>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}`,
  })

  return response.data.stakedAmount.toString()
}

/**
 * Stake given amount of tokens.
 *
 * @param requestOptions Options for making requests
 * @param amount
 * @param options
 */
export async function stake(
  requestOptions: BeeRequestOptions,
  amount: NumberString,
  options?: TransactionOptions,
): Promise<void> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.gasLimit) {
    headers['gas-limit'] = options.gasLimit.toString()
  }

  await http<BeeGenericResponse>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/${amount}`,
    headers,
  })
}

/**
 * Get current status of node in redistribution game
 *
 * @param requestOptions Options for making requests
 */
export async function getRedistributionState(requestOptions: BeeRequestOptions): Promise<RedistributionState> {
  const response = await http<RedistributionState>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: REDISTRIBUTION_ENDPOINT,
  })

  return response.data
}
