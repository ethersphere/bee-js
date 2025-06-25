import { Types } from 'cafe-utility'
import { BeeRequestOptions, NumberString, RedistributionState, TransactionOptions } from '../../types'
import { prepareRequestHeaders } from '../../utils/headers'
import { http } from '../../utils/http'
import { BZZ, DAI } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return BZZ.fromPLUR(asNumberString(body.stakedAmount, { name: 'stakedAmount' }))
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return BZZ.fromPLUR(asNumberString(body.withdrawableAmount, { name: 'withdrawableAmount' }))
}

export async function withdrawSurplusStake(requestOptions: BeeRequestOptions): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/withdrawable`,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asHexString(body.txHash, { name: 'txHash' }))
}

export async function migrateStake(requestOptions: BeeRequestOptions): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'delete',
    responseType: 'json',
    url: STAKE_ENDPOINT,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asHexString(body.txHash, { name: 'txHash' }))
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
  const repsonse = await http<unknown>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${STAKE_ENDPOINT}/${amount}`,
    headers: prepareRequestHeaders(null, options),
  })

  const body = Types.asObject(repsonse.data, { name: 'response.data' })

  return new TransactionId(Types.asHexString(body.txHash, { name: 'txHash' }))
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
