import { Binary } from 'cafe-utility'
import { EnvelopeWithBatchId, NumberString } from '../types'
import { Bytes } from './bytes'
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
 * Utility function that calculates the theoritical maximum capacity of a postage batch based on its depth.
 *
 * For smaller depths (up to 20), this may provide less accurate results.
 *
 * @returns {number} The maximum capacity of the postage batch in bytes.
 */
export function getStampMaximumCapacityBytes(depth: number): number {
  return 2 ** depth * 4096
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

/**
 * Utility function that calculates the effective volume of a postage batch based on its depth.
 *
 * Below 22 depth the effective volume is 0
 * Above 34 it's always > 99%
 *
 * @returns {number} The effective volume of the postage batch in bytes.
 */
export function getStampEffectiveBytes(depth: number): number {
  if (depth < 22) {
    return 0
  }

  const utilRate = utilisationRateMap[depth] ?? 0.99

  return getStampMaximumCapacityBytes(depth) * utilRate
}

/**
 * Utility function that calculates the cost of a postage batch based on its depth and amount.
 *
 * @returns {number} The cost of the postage batch in PLUR (10000000000000000 [1e16] PLUR = 1 BZZ)
 */
export function getStampCostInPlur(depth: number, amount: NumberString | string | bigint): bigint {
  const amountBigint = BigInt(asNumberString(amount))
  return 2n ** BigInt(depth) * amountBigint
}

/**
 * Utility function that calculates the cost of a postage batch based on its depth and amount.
 *
 * The returned number is lossy and should be used for display purposes only.
 *
 * @returns {number} The cost of the postage batch in BZZ (1 BZZ = 10000000000000000 [1e16] PLUR)
 */
export function getStampCostInBzz(depth: number, amount: NumberString | string | bigint): number {
  const BZZ_UNIT = 10 ** 16

  return Number(getStampCostInPlur(depth, amount)) / BZZ_UNIT
}

/**
 * Utility function that calculates the TTL of a postage batch based on its amount, price per block and block time.
 *
 * For more accurate results, get the price per block and block time from the Bee node or the blockchain.
 *
 * @returns {number} The TTL of the postage batch in seconds.
 */
export function getStampTtlSeconds(
  amount: NumberString | string | bigint,
  pricePerBlock = 24_000,
  blockTime = 5,
): bigint {
  const amountBigint = BigInt(asNumberString(amount))
  return (amountBigint * BigInt(blockTime)) / BigInt(pricePerBlock)
}

/**
 * Utility function that calculates the amount of tokens required to maintain a given Time To Live (TTL) for a postage batch.
 *
 * This function estimates the required amount based on the provided TTL in days.
 *
 * @param {number} days - The Time To Live (TTL) in days.
 * @returns {NumberString} The estimated amount of tokens needed for the specified TTL.
 */
export function getAmountForTtl(days: number, pricePerBlock = 24_000, blockTime = 5): bigint {
  return (days <= 0 ? 1n : BigInt(days)) * ((24n * 60n * 60n * BigInt(pricePerBlock)) / BigInt(blockTime))
}

/**
 * Utility function that calculates the depth required for a postage batch to achieve the specified capacity in gigabytes.
 *
 * The depth is determined based on the given gigabytes, and the result is adjusted to a minimum depth of 18.
 *
 * @param {number} gigabytes - The desired capacity of the postage batch in gigabytes.
 * @returns {number} The calculated depth necessary to achieve the specified capacity.
 */
export function getDepthForCapacity(gigabytes: number): number {
  return gigabytes <= 1 ? 18 : Math.ceil(Math.log2(Math.ceil(gigabytes)) + 18)
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
