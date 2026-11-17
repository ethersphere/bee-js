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

test('Duration.parseFromString converts units', () => {
  expect(Duration.parseFromString('1.5h').toSeconds()).toBe(5400)
  expect(Duration.parseFromString('2 weeks').toSeconds()).toBe(1_209_600)
  expect(Duration.parseFromString('3000').toSeconds()).toBe(3)
})

test('Duration.parseFromString rejects unknown units and non-numbers', () => {
  expect(() => Duration.parseFromString('3 eons')).toThrow('Unknown unit: "eons"')
  expect(() => Duration.parseFromString('soon')).toThrow('makeDate got NaN for input')
})

test.each([
  [9, 'A few seconds'],
  [119, '119 seconds'],
  [7199, '119 minutes'],
  [172799, '47 hours'],
  [1209599, '13 days'],
  [1209600, '2 weeks'],
])('Duration.fromSeconds(%d).represent()', (seconds, expected) => {
  expect(Duration.fromSeconds(seconds).represent()).toBe(expected)
})
