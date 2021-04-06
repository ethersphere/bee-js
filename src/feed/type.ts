const feedTypes = ['sequence', 'epoch'] as const
export type FeedType = typeof feedTypes[number]
export const DEFAULT_FEED_TYPE = 'sequence' as FeedType

export function isFeedType(type: unknown): type is FeedType {
  return typeof type === 'string' && feedTypes.includes(type as FeedType)
}
export function assertIsFeedType(type: unknown): asserts type is FeedType {
  if (!isFeedType(type)) {
    throw new TypeError('invalid feed type')
  }
}
