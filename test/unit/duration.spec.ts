import { Duration } from '../../src'

test('Duration', () => {
  expect(Duration.fromMilliseconds(1000).toSeconds()).toBe(1)
  expect(Duration.fromSeconds(24 * 60 * 60).toDays()).toBe(1)
  expect(Duration.fromHours(24).toDays()).toBe(1)
  expect(Duration.fromDays(7).toWeeks()).toBe(1)
  expect(Duration.fromWeeks(52).toYears()).toBe(0.9972602739726028)
})
