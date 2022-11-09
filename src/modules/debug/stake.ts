import { http } from '../../utils/http'
import { BeeGenericResponse, Ky, NumberString, TransactionOptions } from '../../types'

const STAKE_ENDPOINT = 'stake'

interface GetStake {
  stakedAmount: NumberString
}

/**
 * Gets the staked amount
 *
 * @param ky Ky instance for given Bee class instance
 */
export async function getStake(ky: Ky): Promise<NumberString> {
  const response = await http<GetStake>(ky, {
    method: 'get',
    responseType: 'json',
    path: `${STAKE_ENDPOINT}`,
  })

  return response.data.stakedAmount.toString()
}

/**
 * Stake given amount of tokens.
 *
 * @param ky
 * @param amount
 * @param options
 */
export async function stake(ky: Ky, amount: NumberString, options?: TransactionOptions): Promise<void> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.gasLimit) {
    headers['gas-limit'] = options.gasLimit.toString()
  }

  await http<BeeGenericResponse>(ky, {
    method: 'post',
    responseType: 'json',
    path: `${STAKE_ENDPOINT}/deposit/${amount}`,
    headers,
  })
}
