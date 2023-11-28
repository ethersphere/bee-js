import { NumberString } from '../types'

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
 * Utility function that calculates the cost of a postage batch based on its depth and amount.
 *
 * @returns {number} The cost of the postage batch in PLUR (10000000000000000 [1e16] PLUR = 1 BZZ)
 */
export function getStampCostInPlur(depth: number, amount: number): number {
  return 2 ** depth * amount
}

/**
 * Utility function that calculates the cost of a postage batch based on its depth and amount.
 *
 * @returns {number} The cost of the postage batch in BZZ (1 BZZ = 10000000000000000 [1e16] PLUR)
 */
export function getStampCostInBzz(depth: number, amount: number): number {
  const BZZ_UNIT = 10 ** 16

  return getStampCostInPlur(depth, amount) / BZZ_UNIT
}

/**
 * Utility function that calculates the TTL of a postage batch based on its amount, price per block and block time.
 *
 * For more accurate results, get the price per block and block time from the Bee node or the blockchain.
 *
 * @returns {number} The TTL of the postage batch in seconds.
 */
export function getStampTtlSeconds(amount: number, pricePerBlock = 24_000, blockTime = 5): number {
  return (amount * blockTime) / pricePerBlock
}

/**
 * Utility function that calculates the amount of tokens required to maintain a given Time To Live (TTL) for a postage batch.
 *
 * This function estimates the required amount based on the provided TTL in days.
 *
 * @param {number} days - The Time To Live (TTL) in days.
 * @returns {NumberString} The estimated amount of tokens needed for the specified TTL.
 */
export function getAmountForTtl(days: number): NumberString {
  // 414720000 = (24 * 60 * 60 * 24_000) / 5
  return ((days <= 0 ? 1 : days) * 414720000).toString() as NumberString
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
