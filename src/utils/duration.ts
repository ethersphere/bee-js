export class Duration {
  private seconds: number

  private constructor(seconds: number) {
    this.seconds = Math.ceil(seconds)

    if (seconds <= 0) {
      throw Error('Duration must be greater than 0')
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
}
