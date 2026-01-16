// TODO: Remove this file after the issue is fixed

export function normalizeBatchTTL(batchTTL: number) {
  if (!Number.isInteger(batchTTL)) {
    return 1
  }

  if (batchTTL < 1) {
    return 1
  }

  // Cap `batchTTL` (represents seconds) to 100 years.
  // We can assume `storagePrice` is invalid (e.g. 1).
  // This is needed to prevent Date objects breaking.
  if (batchTTL > 3_155_695_200) {
    return 3_155_695_200
  }

  return batchTTL
}

export function normalizeCurrentPrice(currentPrice: number) {
  if (!Number.isInteger(currentPrice)) {
    return 24000
  }

  if (currentPrice < 24000) {
    return 24000
  }

  return currentPrice
}
