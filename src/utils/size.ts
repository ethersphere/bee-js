import { Numbers } from 'cafe-utility'

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
    return Size.fromBytes(Numbers.makeStorage(size, 1000))
  }

  toBytes(): number {
    return this.bytes
  }

  toGigabytes(): number {
    return this.bytes / 1000 / 1000 / 1000
  }

  toFormattedString(): string {
    return Numbers.convertBytes(this.bytes, 1000)
  }

  represent(): string {
    return this.toFormattedString()
  }
}
