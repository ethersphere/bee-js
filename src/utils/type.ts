export function isInteger(type: unknown): type is number | BigInt {
  return (
    typeof type === 'bigint' ||
    (typeof type === 'number' &&
      type > Number.MIN_SAFE_INTEGER &&
      type < Number.MAX_SAFE_INTEGER &&
      Number.isInteger(type))
  )
}

export function assertInteger(type: unknown): asserts type is number | BigInt {
  if (isInteger(type)) throw new TypeError('value is not integer')
}
