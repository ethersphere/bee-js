export type FeedType = 'sequence' | 'epoch'

const feedTypes = ['sequence', 'epoch']

export function verifyFeedType(type: unknown): FeedType {
  if (typeof type !== 'string') {
    throw new Error(`verifyFeedType failed, type is not string`)
  }
  if (!feedTypes.includes(type)) {
    throw new Error(`verifyFeedType failed, type is not valid feed type`)
  }

  return type as FeedType
}
