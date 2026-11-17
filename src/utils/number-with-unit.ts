export function parseNumberWithUnit(numberWithUnit: string): { amount: number; unit: string } {
  return {
    amount: parseFloat(numberWithUnit),
    unit: numberWithUnit
      .replace(/^-?[0-9.]+/, '')
      .trim()
      .toLowerCase(),
  }
}
