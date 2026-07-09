import type { BeeRequestOptions, NumberString, RedistributionState, TransactionOptions } from '../types'
import {
  GetRedistributionStateResponse,
  GetStakeResponse,
  GetWithdrawableStakeResponse,
  TxHashResponse,
} from '../types/schema/stake'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { TransactionOptionsSchema } from '../utils/schema'
import { BZZ } from '../utils/tokens'
import { asNumberString } from '../utils/type'
import { TransactionId } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const STAKE_ENDPOINT = 'stake'
const REDISTRIBUTION_ENDPOINT = 'redistributionstate'

/**
 * Staking operations.
 *
 * Accessed as `bee.stake`.
 */
export class Stake {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets the amount of staked BZZ.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(requestOptions?: BeeRequestOptions): Promise<BZZ> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      responseType: 'json',
      url: STAKE_ENDPOINT,
    })

    return GetStakeResponse.parse(response.data).stakedAmount
  }

  /**
   * Gets the amount of withdrawable staked BZZ.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getWithdrawable(requestOptions?: BeeRequestOptions): Promise<BZZ> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      responseType: 'json',
      url: `${STAKE_ENDPOINT}/withdrawable`,
    })

    return GetWithdrawableStakeResponse.parse(response.data).withdrawableAmount
  }

  /**
   * Stakes the given amount of BZZ. Initial deposit must be at least 10 BZZ.
   *
   * Be aware that staked BZZ tokens can **not** be withdrawn.
   *
   * @param amount Amount of BZZ tokens to be staked. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async deposit(
    amount: BZZ | NumberString | string | bigint,
    options?: TransactionOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    if (options) {
      options = TransactionOptionsSchema.parse(options)
    }

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      responseType: 'json',
      url: `${STAKE_ENDPOINT}/${amountString}`,
      headers: prepareRequestHeaders(null, options),
    })

    return TxHashResponse.parse(response.data).txHash
  }

  /**
   * Withdraws all surplus staked BZZ to the node wallet.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async withdrawSurplus(requestOptions?: BeeRequestOptions): Promise<TransactionId> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'delete',
      responseType: 'json',
      url: `${STAKE_ENDPOINT}/withdrawable`,
    })

    return TxHashResponse.parse(response.data).txHash
  }

  /**
   * Withdraws all staked BZZ to the node wallet.
   *
   * **Only available when the staking contract is paused and is in the process of being migrated to a new contract!**
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async migrate(requestOptions?: BeeRequestOptions): Promise<TransactionId> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'delete',
      responseType: 'json',
      url: STAKE_ENDPOINT,
    })

    return TxHashResponse.parse(response.data).txHash
  }

  /**
   * Gets current status of node in redistribution game.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getRedistributionState(requestOptions?: BeeRequestOptions): Promise<RedistributionState> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      responseType: 'json',
      url: REDISTRIBUTION_ENDPOINT,
    })

    return GetRedistributionStateResponse.parse(response.data)
  }
}
