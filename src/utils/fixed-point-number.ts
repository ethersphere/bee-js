import { BeeError } from './error.js'

export class FixedPointNumber {
  readonly value: bigint

  constructor(
    value: bigint | string | number,
    readonly scale: number,
  ) {
    if (scale < 0) {
      throw new BeeError('Scale must be non-negative')
    }
    this.value = BigInt(value)
  }

  static fromDecimalString(decimalString: string, scale: number): FixedPointNumber {
    const plain = /e-\d+$/i.test(decimalString) ? parseFloat(decimalString).toFixed(scale) : decimalString
    const [whole, fraction = ''] = plain.split('.')

    return new FixedPointNumber(BigInt(whole + fraction.padEnd(scale, '0').slice(0, scale)), scale)
  }

  static fromFloat(value: number, scale: number): FixedPointNumber {
    return FixedPointNumber.fromDecimalString(value.toString(), scale)
  }

  add(other: FixedPointNumber): FixedPointNumber {
    this.assertSameScale(other)

    return new FixedPointNumber(this.value + other.value, this.scale)
  }

  subtract(other: FixedPointNumber): FixedPointNumber {
    this.assertSameScale(other)

    return new FixedPointNumber(this.value - other.value, this.scale)
  }

  divmod(divisor: bigint): [FixedPointNumber, FixedPointNumber] {
    if (divisor === 0n) {
      throw new BeeError('Division by zero is not allowed')
    }

    return [
      new FixedPointNumber(this.value / divisor, this.scale),
      new FixedPointNumber(this.value % divisor, this.scale),
    ]
  }

  exchange(direction: '*' | '/', rate: FixedPointNumber, targetScale: number): FixedPointNumber {
    if (direction === '*') {
      return new FixedPointNumber((this.value * rate.value) / 10n ** BigInt(this.scale), targetScale)
    }
    this.assertSameScale(rate)

    return new FixedPointNumber((this.value * 10n ** BigInt(targetScale)) / rate.value, targetScale)
  }

  compare(other: FixedPointNumber): 1 | 0 | -1 {
    this.assertSameScale(other)

    if (this.value > other.value) {
      return 1
    }

    return this.value < other.value ? -1 : 0
  }

  toDecimalString(): string {
    if (this.scale === 0) {
      return this.value.toString()
    }
    const digits = this.value.toString()
    const whole = digits.slice(0, -this.scale) || '0'
    const fraction = digits.slice(-this.scale).padStart(this.scale, '0')

    return `${whole}.${fraction}`
  }

  toString(): string {
    return this.value.toString()
  }

  toJSON(): string {
    return this.toString()
  }

  toFloat(): number {
    return parseFloat(this.toDecimalString())
  }

  private assertSameScale(other: FixedPointNumber): void {
    if (this.scale !== other.scale) {
      throw new BeeError(`Scale mismatch: expected ${this.scale}, but got ${other.scale}`)
    }
  }
}
