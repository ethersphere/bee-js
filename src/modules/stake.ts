import type { BeeRequestOptions, NumberString, RedistributionState, TransactionOptions } from '../types'
import { TransactionOptionsSchema } from '../utils/schema'
import { BZZ } from '../utils/tokens'
import { asNumberString } from '../utils/type'
import { TransactionId } from '../utils/typed-bytes'
import * as stakeApi from '../api/stake'
import * as redistributionApi from '../api/redistributionstate'
import type { BeeContext } from './context'

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
    return stakeApi.getStake(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the amount of withdrawable staked BZZ.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getWithdrawable(requestOptions?: BeeRequestOptions): Promise<BZZ> {
    return stakeApi.getWithdrawableStake(this.context.getRequestOptionsForCall(requestOptions))
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

    return stakeApi.depositStake(this.context.getRequestOptionsForCall(requestOptions), amountString, options)
  }

  /**
   * Withdraws all surplus staked BZZ to the node wallet.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async withdrawSurplus(requestOptions?: BeeRequestOptions): Promise<TransactionId> {
    return stakeApi.withdrawSurplusStake(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Withdraws all staked BZZ to the node wallet.
   *
   * **Only available when the staking contract is paused and is in the process of being migrated to a new contract!**
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async migrate(requestOptions?: BeeRequestOptions): Promise<TransactionId> {
    return stakeApi.migrateStake(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets current status of node in redistribution game.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getRedistributionState(requestOptions?: BeeRequestOptions): Promise<RedistributionState> {
    return redistributionApi.getRedistributionState(this.context.getRequestOptionsForCall(requestOptions))
  }
}
