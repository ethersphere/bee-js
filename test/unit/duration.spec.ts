import { Duration } from '../../src'

test('Duration', () => {
  expect(Duration.fromMilliseconds(1000).toSeconds()).toBe(1)
  expect(Duration.fromSeconds(24 * 60 * 60).toDays()).toBe(1)
  expect(Duration.fromHours(24).toDays()).toBe(1)
  expect(Duration.fromDays(7).toWeeks()).toBe(1)
  expect(Duration.fromWeeks(52).toYears()).toBe(0.9972602739726028)
})

test('Duration.parseFromString', () => {
  expect(Duration.parseFromString('28h').toSeconds()).toEqual(Duration.fromHours(28).toSeconds())
  expect(Duration.parseFromString('1D').toSeconds()).toEqual(Duration.fromDays(1).toSeconds())
  expect(Duration.parseFromString('5 d').toSeconds()).toEqual(Duration.fromDays(5).toSeconds())
  expect(Duration.parseFromString('2weeks').toSeconds()).toEqual(Duration.fromWeeks(2).toSeconds())
  expect(Duration.parseFromString('1.5h').toSeconds()).toEqual(Duration.fromHours(1.5).toSeconds())
})
