import { System } from 'cafe-utility'
import { z } from 'zod'
import type {
  BeeRequestOptions,
  GlobalPostageBatch,
  NumberString,
  PostageBatch,
  PostageBatchBuckets,
  PostageBatchOptions,
  RedundancyLevel,
} from '../types'
import { STAMPS_DEPTH_MAX, STAMPS_DEPTH_MIN } from '../types'
import type { Duration } from '../utils/duration'
import { BeeArgumentError, BeeError } from '../utils/error'
import { PostageBatchOptionsSchema } from '../utils/schema'
import { getStampDuration } from '../utils/stamps'
import { BZZ } from '../utils/tokens'
import { asNumberString } from '../utils/type'
import { BatchId } from '../utils/typed-bytes'
import * as stampApi from '../api/stamp'
import * as batchesApi from '../api/batches'
import type { BeeContext } from './context'

/**
 * Low-level postage batch (stamp) operations.
 *
 * Accessed as `bee.stamp`. For the ergonomic wrapper see `bee.storage`.
 */
export class Stamp {
  constructor(private readonly context: BeeContext) {}

  /**
   * Creates a new postage batch, spending BZZ tokens from the node wallet.
   *
   * Use `bee.storage.buy` for a more convenient way to create a postage batch.
   *
   * @param amount TTL parameter - 1 day at the minimum of 24,000 storage price requires an amount of 414,720,000.
   * @param depth Capacity parameter - 17..255.
   * @param options Options for creation of postage batch
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async create(
    amount: NumberString | string | bigint,
    depth: number,
    options?: PostageBatchOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    const amountString = asNumberString(amount, { min: 0n, name: 'amount' })

    if (options) {
      options = PostageBatchOptionsSchema.parse(options)
    }

    if (depth < STAMPS_DEPTH_MIN || depth > STAMPS_DEPTH_MAX) {
      throw new BeeArgumentError(`Depth has to be between ${STAMPS_DEPTH_MIN}..${STAMPS_DEPTH_MAX}`, depth)
    }

    const chainState = await this.context.bee.status.getChainState()
    const minimumAmount = BigInt(chainState.currentPrice) * 17280n + 1n

    if (BigInt(amountString) < minimumAmount) {
      throw new BeeArgumentError(
        `Amount has to be at least ${minimumAmount} (1 day at current price ${chainState.currentPrice})`,
        amountString,
      )
    }

    const batchId = await stampApi.createPostageBatch(
      this.context.getRequestOptionsForCall(requestOptions),
      amountString,
      depth,
      options?.label,
      options?.gasPrice?.toString(),
      options?.immutableFlag,
    )

    if (options?.waitForUsable !== false) {
      await this.waitForUsable(batchId, options?.waitForUsableTimeout)
    }

    return batchId
  }

  /**
   * Updates the label of a certain postage batch.
   *
   * @param postageBatchId Batch ID of the postage batch to update.
   * @param label New label for the postage batch.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async updateLabel(
    postageBatchId: BatchId | Uint8Array | string,
    label: string,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    const id = new BatchId(postageBatchId)

    await stampApi.updateLabel(this.context.getRequestOptionsForCall(requestOptions), id, label)
  }

  /**
   * Calculates the `amount` and expected duration extension for topping up a postage batch with a given BZZ value.
   *
   * @param depth Depth of the postage batch to top up.
   * @param bzz The amount of BZZ to spend on the top-up.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async calculateTopUpForBZZ(
    depth: number,
    bzz: BZZ,
    requestOptions?: BeeRequestOptions,
  ): Promise<{ amount: bigint; duration: Duration }> {
    const chainState = await this.context.bee.status.getChainState(requestOptions)
    const blockTime = this.context.network === 'gnosis' ? 5 : 15
    const amount = bzz.toPLURBigInt() / 2n ** BigInt(depth)
    const duration = getStampDuration(amount, chainState.currentPrice, blockTime)

    return { amount, duration }
  }

  /**
   * Increases the duration of a postage batch by increasing its amount.
   *
   * @param postageBatchId Batch ID
   * @param amount Amount to be added to the batch
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async topUp(
    postageBatchId: BatchId | Uint8Array | string,
    amount: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    const id = new BatchId(postageBatchId)
    const amountString = asNumberString(amount, { min: 1n, name: 'amount' })

    return stampApi.topUpBatch(this.context.getRequestOptionsForCall(requestOptions), id, amountString)
  }

  /**
   * Dilutes a postage batch to extend its capacity by increasing its depth.
   *
   * @param postageBatchId Batch ID
   * @param depth New depth for the batch
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async dilute(
    postageBatchId: BatchId | Uint8Array | string,
    depth: number,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    const id = new BatchId(postageBatchId)
    const depthNumber = z.number().int().min(18).max(255).parse(depth)

    return stampApi.diluteBatch(this.context.getRequestOptionsForCall(requestOptions), id, depthNumber)
  }

  /**
   * Returns details for a specific postage batch.
   *
   * @param postageBatchId Batch ID
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume that uploads with this postage batch are encrypted, which skews the capacity.
   * @param erasureCodeLevel Assume that uploads with this postage batch are erasure coded, which skews the capacity.
   */
  async get(
    postageBatchId: BatchId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<PostageBatch> {
    const id = new BatchId(postageBatchId)

    return stampApi.getPostageBatch(
      this.context.getRequestOptionsForCall(requestOptions),
      id,
      encryption,
      erasureCodeLevel,
    )
  }

  /**
   * Returns details for a specific globally available postage batch.
   *
   * @param postageBatchId Batch ID
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getGlobal(
    postageBatchId: BatchId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<GlobalPostageBatch> {
    const id = new BatchId(postageBatchId)

    return batchesApi.getGlobalPostageBatch(this.context.getRequestOptionsForCall(requestOptions), id)
  }

  /**
   * Returns detailed information related to buckets for a specific postage batch.
   *
   * @param postageBatchId Batch ID
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getBuckets(
    postageBatchId: BatchId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<PostageBatchBuckets> {
    const id = new BatchId(postageBatchId)

    return stampApi.getPostageBatchBuckets(this.context.getRequestOptionsForCall(requestOptions), id)
  }

  /**
   * Returns all postage batches that belong to the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<PostageBatch[]> {
    return stampApi.getAllPostageBatches(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Returns all globally available postage batches.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllGlobal(requestOptions?: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
    return batchesApi.getAllGlobalPostageBatches(this.context.getRequestOptionsForCall(requestOptions))
  }

  private async waitForUsable(id: BatchId, timeout = 240_000): Promise<void> {
    const TIME_STEP = 3_000

    for (let time = 0; time < timeout; time += TIME_STEP) {
      try {
        const stamp = await this.get(id)

        if (stamp.usable) {
          return
        }
      } catch {
        // ignore error
      }

      await System.sleepMillis(TIME_STEP)
    }

    throw new BeeError('Timeout on waiting for postage stamp to become usable')
  }
}
