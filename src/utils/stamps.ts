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
  if(depth < 22) {
    return 0
  }

  const utilRate = utilisationRateMap[depth] ?? 0.99

  return getStampMaximumCapacityBytes(depth) * utilRate;
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
