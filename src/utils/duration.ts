import { BeeError } from './error.js'
import { parseNumberWithUnit } from './number-with-unit.js'

export class Duration {
  private seconds: number
  static ZERO: Duration = new Duration(0)

  private constructor(seconds: number) {
    this.seconds = Math.ceil(seconds)

    if (seconds < 0) {
      this.seconds = 0
    }
  }

  static fromMilliseconds(milliseconds: number): Duration {
    return new Duration(milliseconds / 1000)
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds)
  }

  static fromHours(hours: number): Duration {
    return new Duration(hours * 60 * 60)
  }

  static fromDays(days: number): Duration {
    return new Duration(days * 24 * 60 * 60)
  }

  static fromWeeks(weeks: number): Duration {
    return new Duration(weeks * 7 * 24 * 60 * 60)
  }

  static fromYears(years: number): Duration {
    return new Duration(years * 365 * 24 * 60 * 60)
  }

  static fromEndDate(endDate: Date, startDate?: Date): Duration {
    return new Duration((endDate.getTime() - (startDate ?? new Date()).getTime()) / 1000)
  }

  /**
   * Parses a duration string and returns a `Duration` instance.
   *
   * Case insensitive. E.g. both `"28h"` and `"1D"` are valid.
   *
   * Whitespaces are ignored. E.g. both `"5 d"` and `"2weeks"` are valid.
   *
   * Decimal numbers are supported. E.g. `"1.5h"` is valid.
   *
   * Supported units:
   *
   * - ms, milli, millis, millisecond, milliseconds
   * - s, sec, second, seconds
   * - m, min, minute, minutes
   * - h, hour, hours
   * - d, day, days
   * - w, week, weeks
   * - month, months
   * - y, year, years
   *
   * @param duration - A string representing a duration
   * @returns a `Duration` instance
   */
  static parseFromString(duration: string): Duration {
    return Duration.fromSeconds(parseDurationMillis(duration) / 1000)
  }

  toSeconds(): number {
    return this.seconds
  }

  toHours(): number {
    return this.seconds / 60 / 60
  }

  toDays(): number {
    return this.seconds / 24 / 60 / 60
  }

  toWeeks(): number {
    return this.seconds / 7 / 24 / 60 / 60
  }

  toYears(): number {
    return this.seconds / 365 / 24 / 60 / 60
  }

  toEndDate(startDate?: Date): Date {
    return new Date((startDate ?? new Date()).getTime() + this.seconds * 1000)
  }

  represent(): string {
    return formatDuration(this.seconds)
  }

  isZero(): boolean {
    return this.seconds === 0
  }
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

const DATE_UNITS: Record<string, number> = {
  ms: 1,
  milli: 1,
  millis: 1,
  millisecond: 1,
  milliseconds: 1,
  s: SECOND,
  sec: SECOND,
  second: SECOND,
  seconds: SECOND,
  m: MINUTE,
  min: MINUTE,
  minute: MINUTE,
  minutes: MINUTE,
  h: HOUR,
  hour: HOUR,
  hours: HOUR,
  d: DAY,
  day: DAY,
  days: DAY,
  w: WEEK,
  week: WEEK,
  weeks: WEEK,
  month: 30 * DAY,
  months: 30 * DAY,
  y: 365 * DAY,
  year: 365 * DAY,
  years: 365 * DAY,
}

function parseDurationMillis(numberWithUnit: string): number {
  const { amount, unit } = parseNumberWithUnit(numberWithUnit)

  if (isNaN(amount)) {
    throw new BeeError('makeDate got NaN for input')
  }
  const multiplier = unit === '' ? 1 : DATE_UNITS[unit]

  if (!multiplier) {
    throw new BeeError(`Unknown unit: "${unit}"`)
  }

  return Math.ceil(amount * multiplier)
}

function formatDuration(seconds: number): string {
  if (seconds < 10) {
    return 'A few seconds'
  }

  if (seconds < 120) {
    return `${Math.floor(seconds)} seconds`
  }
  const minutes = seconds / 60

  if (minutes < 120) {
    return `${Math.floor(minutes)} minutes`
  }
  const hours = minutes / 60

  if (hours < 48) {
    return `${Math.floor(hours)} hours`
  }
  const days = hours / 24

  if (days < 14) {
    return `${Math.floor(days)} days`
  }

  return `${Math.floor(days / 7)} weeks`
}
