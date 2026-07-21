import { EnvelopeWithBatchId, NumberString, PostageBatch, RedundancyLevel } from '../types'
import { Bytes } from './bytes'
import { Duration } from './duration'
import { Size } from './size'
import { BZZ } from './tokens'
import { asNumberString } from './type'
import { BatchId } from './typed-bytes'
import { normalizeBatchTTL } from './workaround'
import {
  convertEnvelopeToMarshaledStamp as coreConvertEnvelopeToMarshaledStamp,
  getDepthForSize as coreGetDepthForSize,
  getStampEffectiveBytes,
  getStampEffectiveBytesBreakpoints,
  getStampTheoreticalBytes,
  getStampUsage,
  marshalStamp as coreMarshalStamp,
} from 'swarm-core'

export { getStampEffectiveBytes, getStampEffectiveBytesBreakpoints, getStampTheoreticalBytes, getStampUsage }

/**
 * Utility function that calculates the cost of a postage batch based on its depth and amount.
 */
export function getStampCost(depth: number, amount: NumberString | string | bigint): BZZ {
  return BZZ.fromPLUR(2n ** BigInt(depth) * BigInt(amount))
}

/**
 * Utility function that calculates the TTL of a postage batch based on its amount, price per block and block time.
 *
 * For more accurate results, get the price per block and block time from the Bee node or the blockchain.
 *
 * @returns {number} The TTL of the postage batch.
 */
export function getStampDuration(
  amount: NumberString | string | bigint,
  pricePerBlock: number,
  blockTime: number,
): Duration {
  const amountBigInt = BigInt(asNumberString(amount))

  return Duration.fromSeconds(Number((amountBigInt * BigInt(blockTime)) / BigInt(pricePerBlock)))
}

/**
 * Get the postage batch `amount` required for a given `duration`.
 *
 * @param duration A duration object representing the duration of the storage.
 * @param pricePerBlock The price per block in PLUR.
 * @param blockTime The block time in seconds.
 */
export function getAmountForDuration(duration: Duration, pricePerBlock: number, blockTime: number): bigint {
  return (BigInt(duration.toSeconds()) / BigInt(blockTime)) * BigInt(pricePerBlock) + 1n
}

/**
 * Utility function that calculates the depth required for a postage batch to achieve the specified effective size
 *
 * @param size The effective size of the postage batch
 * @returns
 */
export function getDepthForSize(size: Size, encryption?: boolean, erasureCodeLevel?: RedundancyLevel): number {
  return coreGetDepthForSize(size.toBytes(), encryption, erasureCodeLevel)
}

export function convertEnvelopeToMarshaledStamp(envelope: EnvelopeWithBatchId): Bytes {
  return coreConvertEnvelopeToMarshaledStamp(envelope)
}

export function marshalStamp(
  signature: Uint8Array,
  batchId: Uint8Array,
  timestamp: Uint8Array,
  index: Uint8Array,
): Bytes {
  return coreMarshalStamp(signature, batchId, timestamp, index)
}

export interface RawPostageBatch {
  batchID: string
  utilization: number
  utilizationRatio?: number
  usable: boolean
  label: string
  depth: number
  amount: string
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
  batchTTL: number
}

export function mapPostageBatch(
  raw: RawPostageBatch,
  encryption?: boolean,
  erasureCodeLevel?: RedundancyLevel,
): PostageBatch {
  const batchTTL = normalizeBatchTTL(raw.batchTTL)
  const duration = Duration.fromSeconds(batchTTL)
  const effectiveBytes = getStampEffectiveBytes(raw.depth, encryption, erasureCodeLevel)
  const usage = raw.utilizationRatio ?? getStampUsage(raw.utilization, raw.depth, raw.bucketDepth)

  return {
    batchID: new BatchId(raw.batchID),
    utilization: raw.utilization,
    usable: raw.usable,
    label: raw.label,
    depth: raw.depth,
    amount: asNumberString(raw.amount),
    bucketDepth: raw.bucketDepth,
    blockNumber: raw.blockNumber,
    immutableFlag: raw.immutableFlag,
    usage,
    usageText: `${Math.round(usage * 100)}%`,
    size: Size.fromBytes(effectiveBytes),
    remainingSize: Size.fromBytes(Math.ceil(effectiveBytes * (1 - usage))),
    theoreticalSize: Size.fromBytes(getStampTheoreticalBytes(raw.depth)),
    duration,
    calculateSize(encryption, redundancyLevel) {
      const effectiveBytes = getStampEffectiveBytes(raw.depth, encryption, redundancyLevel)

      return Size.fromBytes(effectiveBytes)
    },
    calculateRemainingSize(encryption, redundancyLevel) {
      const effectiveBytes = getStampEffectiveBytes(raw.depth, encryption, redundancyLevel)

      return Size.fromBytes(Math.ceil(effectiveBytes * (1 - this.usage)))
    },
  }
}

export function unmapPostageBatch(batch: PostageBatch): RawPostageBatch {
  return {
    batchID: batch.batchID.toHex(),
    utilization: batch.utilization,
    utilizationRatio: batch.usage,
    usable: batch.usable,
    label: batch.label,
    depth: batch.depth,
    amount: batch.amount,
    bucketDepth: batch.bucketDepth,
    blockNumber: batch.blockNumber,
    immutableFlag: batch.immutableFlag,
    batchTTL: batch.duration.toSeconds(),
  }
}
