export function isInteger(value: unknown): value is number | BigInt {
  return (
    typeof value === 'bigint' ||
    (typeof value === 'number' &&
      value > Number.MIN_SAFE_INTEGER &&
      value < Number.MAX_SAFE_INTEGER &&
      Number.isInteger(value))
  )
}

export function assertInteger(value: unknown): asserts value is number | BigInt {
  if (!isInteger(value)) throw new TypeError('value is not integer')
}
