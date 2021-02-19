export type FeedType = 'sequence' | 'epoch'

const feedTypes = ['sequence', 'epoch']

export function isFeedType(type: unknown): type is FeedType {
  return typeof type === 'string' && feedTypes.includes(type)
}
export function assertIsFeedType(type: unknown): asserts type is FeedType {
  if (!isFeedType(type)) {
    throw new TypeError(`invalid feed type`)
  }
}
