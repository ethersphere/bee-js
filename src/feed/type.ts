const feedTypes = ['sequence', 'epoch'] as const
export type FeedType = typeof feedTypes[number]

export function isFeedType(type: unknown): type is FeedType {
  return typeof type === 'string' && feedTypes.includes(type as FeedType)
}
export function assertIsFeedType(type: unknown): asserts type is FeedType {
  if (!isFeedType(type)) {
    throw new TypeError('invalid feed type')
  }
}
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
