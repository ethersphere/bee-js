import { Binary } from 'cafe-utility'
import { EnvelopeWithBatchId, NumberString } from '../types'
import { Bytes } from './bytes'
import { Duration } from './duration'
import { Size } from './size'
import { BZZ } from './tokens'
import { asNumberString } from './type'

/**
 * Utility function that calculates usage of postage batch based on its utilization, depth and bucket depth.
 *
 * For smaller depths (up to 20), this may provide less accurate results.
 *
 * @returns {number} A number between 0 and 1 representing the usage of the postage batch.
 */
export function getStampUsage(utilization: number, depth: number, bucketDepth: number): number {
  return utilization / Math.pow(2, depth - bucketDepth)
}

/**
 * Utility function that calculates the theoritical maximum size of a postage batch based on its depth.
 *
 * For smaller depths (up to 22), this may provide less accurate results.
 *
 * @returns {number} The maximum theoretical size of the postage batch in bytes.
 */
export function getStampTheoreticalBytes(depth: number): number {
  return 4096 * 2 ** depth
}

/**
 * Based on https://docs.ethswarm.org/docs/learn/technology/contracts/postage-stamp/#effective-utilisation-table
 */
const utilisationRateMap: Record<number, number> = {
  22: 0.2867,
  23: 0.4956,
  24: 0.6433,
  25: 0.7478,
  26: 0.8217,
  27: 0.8739,
  28: 0.9108,
  29: 0.9369,
  30: 0.9554,
  31: 0.9685,
  32: 0.9777,
  33: 0.9842,
  34: 0.9889,
}

const effectiveSizeBreakpoints = [
  [22, 4.93],
  [23, 17.03],
  [24, 44.21],
  [25, 102.78],
  [26, 225.87],
  [27, 480.44],
  [28, 1001.44],
  [29, 2060.27],
  [30, 4201.9],
  [31, 8519.02],
  [32, 17199.89],
  [33, 34628.46],
]

/**
 * Utility function that calculates the effective size of a postage batch based on its depth.
 *
 * Below 22 depth the effective size is 0
 * Above 34 it's always > 99%
 *
 * @returns {number} The effective size of the postage batch in bytes.
 */
export function getStampEffectiveBytes(depth: number): number {
  if (depth < 22) {
    return 0
  }

  const utilRate = utilisationRateMap[depth] ?? 0.99

  return Math.ceil(getStampTheoreticalBytes(depth) * utilRate)
}

export function getStampEffectiveBytesBreakpoints(): Map<number, number> {
  const map = new Map<number, number>()

  for (let i = 22; i < 35; i++) {
    map.set(i, getStampEffectiveBytes(i))
  }

  return map
}

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
export function getDepthForSize(size: Size): number {
  for (const [depth, sizeBreakpoint] of effectiveSizeBreakpoints) {
    if (size.toGigabytes() <= sizeBreakpoint) {
      return depth
    }
  }

  return 34
}

export function convertEnvelopeToMarshaledStamp(envelope: EnvelopeWithBatchId): Bytes {
  return marshalStamp(envelope.signature, envelope.batchId.toUint8Array(), envelope.timestamp, envelope.index)
}

export function marshalStamp(
  signature: Uint8Array,
  batchId: Uint8Array,
  timestamp: Uint8Array,
  index: Uint8Array,
): Bytes {
  if (signature.length !== 65) {
    throw Error('invalid signature length')
  }

  if (batchId.length !== 32) {
    throw Error('invalid batch ID length')
  }

  if (timestamp.length !== 8) {
    throw Error('invalid timestamp length')
  }

  if (index.length !== 8) {
    throw Error('invalid index length')
  }

  return new Bytes(Binary.concatBytes(batchId, index, timestamp, signature))
}
