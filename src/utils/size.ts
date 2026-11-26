import { BeeError } from './error.js'
import { parseNumberWithUnit } from './number-with-unit.js'

/**
 * Represents a size in bytes.
 *
 * Uses 1000 instead of 1024 for converting between units.
 * This is to stay consistent with the Swarm papers
 * on theoretical and effective storage capacity.
 */
export class Size {
  private bytes: number

  private constructor(bytes: number) {
    this.bytes = Math.ceil(bytes)

    if (bytes < 0) {
      throw Error('Size must be at least 0')
    }
  }

  static fromBytes(bytes: number): Size {
    return new Size(bytes)
  }

  static fromKilobytes(kilobytes: number): Size {
    return new Size(kilobytes * 1000)
  }

  static fromMegabytes(megabytes: number): Size {
    return new Size(megabytes * 1000 * 1000)
  }

  static fromGigabytes(gigabytes: number): Size {
    return new Size(gigabytes * 1000 * 1000 * 1000)
  }

  /**
   * Parses a size string and returns a `Size` instance.
   *
   * Case insensitive. E.g. both `"28MB"` and `"1gb"` are valid.
   *
   * Whitespaces are ignored. E.g. both `"512 kb"` and `"2megabytes"` are valid.
   *
   * Decimal numbers are supported. E.g. `"1.5gb"` is valid.
   *
   * Uses 1000 as the base for conversions. E.g. 1kb = 1000 bytes.
   * This is consistent with the effective stamp utilization table.
   *
   * Supported units:
   * - b, byte, bytes
   * - kb, kilobyte, kilobytes
   * - mb, megabyte, megabytes
   * - gb, gigabyte, gigabytes
   * - tb, terabyte, terabytes
   *
   * @param size - A string representing a size
   * @returns a `Size` instance
   */
  static parseFromString(size: string): Size {
    return Size.fromBytes(parseSize(size, 1000))
  }

  toBytes(): number {
    return this.bytes
  }

  toGigabytes(): number {
    return this.bytes / 1000 / 1000 / 1000
  }

  toFormattedString(): string {
    return formatSize(this.bytes, 1000)
  }

  represent(): string {
    return this.toFormattedString()
  }
}

const STORAGE_UNIT_EXPONENTS: Record<string, number> = {
  b: 0,
  byte: 0,
  bytes: 0,
  kb: 1,
  kilobyte: 1,
  kilobytes: 1,
  mb: 2,
  megabyte: 2,
  megabytes: 2,
  gb: 3,
  gigabyte: 3,
  gigabytes: 3,
  tb: 4,
  terabyte: 4,
  terabytes: 4,
}

function parseSize(numberWithUnit: string, multiplier = 1024): number {
  const { amount, unit } = parseNumberWithUnit(numberWithUnit)

  if (isNaN(amount)) {
    throw new BeeError('makeStorage got NaN for input')
  }
  const exponent = unit === '' ? 0 : STORAGE_UNIT_EXPONENTS[unit]

  if (exponent === undefined) {
    throw new BeeError(`Unknown unit: "${unit}"`)
  }

  return Math.ceil(amount * multiplier ** exponent)
}

function formatSize(bytes: number, divisor = 1024): string {
  const units = ['TB', 'GB', 'MB', 'KB']

  for (const [index, unit] of units.entries()) {
    const size = divisor ** (units.length - index)

    if (bytes >= size) {
      return `${(bytes / size).toFixed(3)} ${unit}`
    }
  }

  return `${bytes} B`
}
