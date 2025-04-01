// TODO: Remove this file after the issue is fixed

export function normalizeBatchTTL(batchTTL: number) {
  if (!Number.isInteger(batchTTL)) {
    return 1
  }

  if (batchTTL < 1) {
    return 1
  }

  if (batchTTL > 315569260) {
    return 315569260
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
