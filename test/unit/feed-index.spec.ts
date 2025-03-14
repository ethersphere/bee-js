import { FeedIndex } from '../../src'

test('FeedIndex.next', () => {
  expect(FeedIndex.fromBigInt(0n).next().toBigInt()).toBe(1n)

  expect(FeedIndex.MINUS_ONE.next().toBigInt()).toBe(0n)
  expect(FeedIndex.MINUS_ONE.next().toBigInt()).toBe(0n) // no mutation

  const feedIndex = FeedIndex.fromBigInt(137n)
  expect(feedIndex.next().next().next().toBigInt()).toBe(140n)
  expect(feedIndex.toBigInt()).toBe(137n) // no mutation
})
