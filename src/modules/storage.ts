import type { BeeRequestOptions, PostageBatchOptions, RedundancyLevel } from '../types'
import type { Duration } from '../utils/duration'
import { BeeArgumentError } from '../utils/error'
import { PostageBatchOptionsSchema } from '../utils/schema'
import type { Size } from '../utils/size'
import { getAmountForDuration, getDepthForSize, getStampCost } from '../utils/stamps'
import type { BZZ } from '../utils/tokens'
import type { BatchId, TransactionId } from '../utils/typed-bytes'
import type { BeeContext } from './context'

/**
 * Ergonomic storage operations expressed in terms of size and duration.
 *
 * Accessed as `bee.storage`. Wraps the low-level `bee.stamp` operations.
 */
export class Storage {
  constructor(private readonly context: BeeContext) {}

  private get blockTime(): number {
    return this.context.network === 'gnosis' ? 5 : 15
  }

  /**
   * Creates a postage batch sized for a certain size and duration on the Swarm network.
   *
   * Use {@link getCost} to calculate the cost beforehand.
   *
   * @param size
   * @param duration
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption
   * @param erasureCodeLevel
   */
  async buy(
    size: Size,
    duration: Duration,
    options?: PostageBatchOptions,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BatchId> {
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.blockTime)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)

    if (options) {
      options = PostageBatchOptionsSchema.parse(options)
    }

    return this.context.bee.stamp.create(amount, depth, options, requestOptions)
  }

  /**
   * Calculates the estimated BZZ cost for creating a postage batch for the given size and duration.
   *
   * @param size Size of the data to be stored.
   * @param duration Duration for which the data should be stored.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   */
  async getCost(
    size: Size,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.blockTime)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)

    return getStampCost(depth, amount)
  }

  /**
   * Extends the storage of a postage batch by either increasing its size, duration or both.
   *
   * The size is ABSOLUTE, while the duration is RELATIVE to the current duration of the postage batch.
   *
   * @param postageBatchId Batch ID of the postage batch to extend.
   * @param size Absolute size to extend the postage batch to.
   * @param duration Relative duration to extend the postage batch by.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   */
  async extend(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BatchId | TransactionId> {
    const batch = await this.context.bee.stamp.get(postageBatchId, requestOptions)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const depthDelta = depth - batch.depth
    const multiplier = depthDelta <= 0 ? 1n : 2n ** BigInt(depthDelta)
    const additionalAmount = getAmountForDuration(duration, chainState.currentPrice, this.blockTime)
    const currentAmount = getAmountForDuration(batch.duration, chainState.currentPrice, this.blockTime)
    const targetAmount = duration.isZero()
      ? currentAmount * multiplier
      : (currentAmount + additionalAmount) * multiplier

    const amountDelta = targetAmount - currentAmount

    let transactionId: TransactionId | undefined

    if (amountDelta > 0n) {
      transactionId = await this.context.bee.stamp.topUp(batch.batchID, amountDelta, requestOptions)
    }

    if (depthDelta > 0) {
      return this.context.bee.stamp.dilute(batch.batchID, depth, requestOptions)
    }

    if (!transactionId) {
      throw new Error('Nothing to extend, both size and duration are already sufficient')
    }

    return transactionId
  }

  /**
   * Extends the storage size of a postage batch by increasing its depth.
   *
   * @param postageBatchId
   * @param size Absolute size to extend the postage batch to.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   */
  async extendSize(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BatchId> {
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const batch = await this.context.bee.stamp.get(postageBatchId, requestOptions)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)
    const delta = depth - batch.depth

    if (delta <= 0) {
      throw new BeeArgumentError('New depth has to be greater than the original depth', depth)
    }

    const currentAmount = getAmountForDuration(batch.duration, chainState.currentPrice, this.blockTime)
    await this.context.bee.stamp.topUp(batch.batchID, currentAmount * (2n ** BigInt(delta) - 1n) + 1n, requestOptions)

    return this.context.bee.stamp.dilute(batch.batchID, depth, requestOptions)
  }

  /**
   * Extends the duration of a postage batch.
   *
   * @param postageBatchId
   * @param duration Relative duration to extend the postage batch by.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async extendDuration(
    postageBatchId: BatchId | Uint8Array | string,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    const batch = await this.context.bee.stamp.get(postageBatchId, requestOptions)
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.blockTime)

    return this.context.bee.stamp.topUp(batch.batchID, amount, requestOptions)
  }

  /**
   * Calculates the cost of extending both the duration and the capacity of a postage batch.
   *
   * @param postageBatchId
   * @param size Absolute size to extend the postage batch to.
   * @param duration Relative duration to extend the postage batch by.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   */
  async getExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const batch = await this.context.bee.stamp.get(postageBatchId, requestOptions)
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const amount = duration.isZero() ? 0n : getAmountForDuration(duration, chainState.currentPrice, this.blockTime)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)

    const currentAmount = getAmountForDuration(batch.duration, chainState.currentPrice, this.blockTime)
    const currentCost = getStampCost(batch.depth, currentAmount)
    const newCost = getStampCost(Math.max(batch.depth, depth), currentAmount + amount)

    return newCost.minus(currentCost)
  }

  /**
   * Calculates the cost of extending the size of a postage batch.
   *
   * @param postageBatchId
   * @param size
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   */
  async getSizeExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const batch = await this.context.bee.stamp.get(postageBatchId, requestOptions)
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)
    const delta = depth - batch.depth

    if (delta <= 0) {
      throw new BeeArgumentError('New depth has to be greater than the original depth', depth)
    }

    const currentAmount = getAmountForDuration(batch.duration, chainState.currentPrice, this.blockTime)
    const currentCost = getStampCost(batch.depth, currentAmount)
    const newCost = getStampCost(depth, currentAmount)

    return newCost.minus(currentCost)
  }

  /**
   * Calculates the cost of extending the duration of a postage batch.
   *
   * @param postageBatchId
   * @param duration
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getDurationExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
  ): Promise<BZZ> {
    const batch = await this.context.bee.stamp.get(postageBatchId, requestOptions)
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.blockTime)

    return getStampCost(batch.depth, amount)
  }

  /**
   * Renames a storage. Convenience wrapper over `bee.stamp.updateLabel`.
   *
   * @param postageBatchId Batch ID of the postage batch to update.
   * @param newLabel New name for the storage.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async rename(
    postageBatchId: BatchId | Uint8Array | string,
    newLabel: string,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    return this.context.bee.stamp.updateLabel(postageBatchId, newLabel, requestOptions)
  }
}
