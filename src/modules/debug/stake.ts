import { Types } from 'cafe-utility'
import { BeeRequestOptions, NumberString, RedistributionState, TransactionOptions } from '../../types'
import { http } from '../../utils/http'
import { BZZ, DAI } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'

const STAKE_ENDPOINT = 'stake'
const REDISTRIBUTION_ENDPOINT = 'redistributionstate'

/**
 * Gets the staked amount
 *
 * @param requestOptions Options for making requests
 */
export async function getStake(requestOptions: BeeRequestOptions): Promise<BZZ> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}`,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return BZZ.fromPLUR(asNumberString(body.stakedAmount, { name: 'stakedAmount' }))
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

  await http<unknown>(requestOptions, {
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
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: REDISTRIBUTION_ENDPOINT,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    minimumGasFunds: DAI.fromWei(asNumberString(body.minimumGasFunds, { name: 'minimumGasFunds' })),
    hasSufficientFunds: Types.asBoolean(body.hasSufficientFunds, { name: 'hasSufficientFunds' }),
    isFrozen: Types.asBoolean(body.isFrozen, { name: 'isFrozen' }),
    isFullySynced: Types.asBoolean(body.isFullySynced, { name: 'isFullySynced' }),
    phase: Types.asString(body.phase, { name: 'phase' }),
    round: Types.asNumber(body.round, { name: 'round' }),
    lastWonRound: Types.asNumber(body.lastWonRound, { name: 'lastWonRound' }),
    lastPlayedRound: Types.asNumber(body.lastPlayedRound, { name: 'lastPlayedRound' }),
    lastFrozenRound: Types.asNumber(body.lastFrozenRound, { name: 'lastFrozenRound' }),
    lastSelectedRound: Types.asNumber(body.lastSelectedRound, { name: 'lastSelectedRound' }),
    lastSampleDurationSeconds: Types.asNumber(body.lastSampleDurationSeconds, { name: 'lastSampleDurationSeconds' }),
    block: Types.asNumber(body.block, { name: 'block' }),
    reward: BZZ.fromPLUR(asNumberString(body.reward, { name: 'reward' })),
    fees: DAI.fromWei(asNumberString(body.fees, { name: 'fees' })),
    isHealthy: Types.asBoolean(body.isHealthy, { name: 'isHealthy' }),
  }
}
