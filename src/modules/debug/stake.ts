import { http } from '../../utils/http'
import { BeeGenericResponse, NumberString, TransactionOptions } from '../../types'
import type { Options as KyOptions } from 'ky'

const STAKE_ENDPOINT = 'stake'

interface GetStake {
  stakedAmount: NumberString
}

/**
 * Gets the staked amount
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getStake(kyOptions: KyOptions): Promise<NumberString> {
  const response = await http<GetStake>(kyOptions, {
    method: 'get',
    responseType: 'json',
    path: `${STAKE_ENDPOINT}`,
  })

  return response.parseData.stakedAmount.toString()
}

/**
 * Stake given amount of tokens.
 *
 * @param ky
 * @param amount
 * @param options
 */
export async function stake(kyOptions: KyOptions, amount: NumberString, options?: TransactionOptions): Promise<void> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.gasLimit) {
    headers['gas-limit'] = options.gasLimit.toString()
  }

  await http<BeeGenericResponse>(kyOptions, {
    method: 'post',
    responseType: 'json',
    path: `${STAKE_ENDPOINT}/${amount}`,
    headers,
  })
}
