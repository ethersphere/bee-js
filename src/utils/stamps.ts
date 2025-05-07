import { Binary } from 'cafe-utility'
import { EnvelopeWithBatchId, NumberString } from '../types'
import { Bytes } from './bytes'
import { Duration } from './duration'
import { Size } from './size'
import { BZZ } from './tokens'
import { asNumberString } from './type'

const MAX_UTILIZATION = 0.9

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
 * Optimised for encrypted, medium erasure coding
 */
const effectiveSizeBreakpoints = [
  [17, 0.00004089],
  [18, 0.00609],
  [19, 0.10249],
  [20, 0.62891],
  [21, 2.38],
  [22, 7.07],
  [23, 18.24],
  [24, 43.04],
  [25, 96.5],
  [26, 208.52],
  [27, 435.98],
  [28, 908.81],
  [29, 1870],
  [30, 3810],
  [31, 7730],
  [32, 15610],
  [33, 31430],
  [34, 63150],
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
  if (depth < 17) {
    return 0
  }

  const breakpoint = effectiveSizeBreakpoints.find(([d, size]) => {
    if (depth === d) {
      return size
    }
  })

  if (breakpoint) {
    return breakpoint[1] * 1000 * 1000 * 1000
  }

  return Math.ceil(getStampTheoreticalBytes(depth) * MAX_UTILIZATION)
}

export function getStampEffectiveBytesBreakpoints(): Map<number, number> {
  const map = new Map<number, number>()

  for (let i = 17; i < 35; i++) {
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
    if (size.toBytes() <= sizeBreakpoint * 1000 * 1000 * 1000) {
      return depth
    }
  }

  return 35
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
