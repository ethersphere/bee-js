import { FixedPointNumber } from 'cafe-utility'
import { NumberString } from '..'

export class BZZ {
  public static readonly DIGITS = 16

  private state: FixedPointNumber

  private constructor(state: FixedPointNumber) {
    this.state = state
  }

  public static fromDecimalString(string: string) {
    return new BZZ(FixedPointNumber.fromDecimalString(string, BZZ.DIGITS))
  }

  public static fromPLUR(plur: NumberString | string | bigint) {
    return new BZZ(new FixedPointNumber(plur, BZZ.DIGITS))
  }

  public toPLURString() {
    return this.state.toString()
  }

  public toPLURBigInt() {
    return this.state.value
  }

  public toDecimalString() {
    return this.state.toDecimalString()
  }

  public toSignificantDigits(digits: number) {
    return this.toDecimalString().slice(0, this.toDecimalString().indexOf('.') + digits + 1)
  }

  /**
   * Does not mutate the current BZZ instance.
   *
   * @param other BZZ instance, or amount in PLUR
   * @returns New BZZ instance
   */
  public plus(other: BZZ | NumberString | string | bigint) {
    return new BZZ(this.state.add(other instanceof BZZ ? other.state : new FixedPointNumber(other, BZZ.DIGITS)))
  }

  /**
   * Does not mutate the current BZZ instance.
   *
   * @param other BZZ instance, or amount in PLUR
   * @returns New BZZ instance
   */
  public minus(other: BZZ | NumberString | string | bigint) {
    return new BZZ(this.state.subtract(other instanceof BZZ ? other.state : new FixedPointNumber(other, BZZ.DIGITS)))
  }

  /**
   * Does not mutate the current BZZ instance.
   *
   * @param other Divisor
   * @returns New BZZ instance
   */
  public divide(other: bigint) {
    return new BZZ(this.state.divide(other)[0])
  }

  public gt(other: BZZ) {
    return this.state.compare(other.state) === 1
  }

  public gte(other: BZZ) {
    return this.state.compare(other.state) !== -1
  }

  public lt(other: BZZ) {
    return this.state.compare(other.state) === -1
  }

  public lte(other: BZZ) {
    return this.state.compare(other.state) !== 1
  }

  public eq(other: BZZ) {
    return this.state.compare(other.state) === 0
  }
}

export class DAI {
  public static readonly DIGITS = 18

  private state: FixedPointNumber

  private constructor(state: FixedPointNumber) {
    this.state = state
  }

  public static fromDecimalString(string: string) {
    return new DAI(FixedPointNumber.fromDecimalString(string, DAI.DIGITS))
  }

  public static fromWei(wei: NumberString | string | bigint) {
    return new DAI(new FixedPointNumber(wei, DAI.DIGITS))
  }

  public toWeiString() {
    return this.state.toString()
  }

  public toWeiBigInt() {
    return this.state.value
  }

  public toDecimalString() {
    return this.state.toDecimalString()
  }

  public toSignificantDigits(digits: number) {
    return this.toDecimalString().slice(0, this.toDecimalString().indexOf('.') + digits + 1)
  }

  /**
   * Does not mutate the current DAI instance.
   *
   * @param other DAI instance, or amount in PLUR
   * @returns New DAI instance
   */
  public plus(other: DAI | NumberString | string | bigint) {
    return new DAI(this.state.add(other instanceof DAI ? other.state : new FixedPointNumber(other, DAI.DIGITS)))
  }

  /**
   * Does not mutate the current DAI instance.
   *
   * @param other DAI instance, or amount in PLUR
   * @returns New DAI instance
   */
  public minus(other: DAI | NumberString | string | bigint) {
    return new DAI(this.state.subtract(other instanceof DAI ? other.state : new FixedPointNumber(other, DAI.DIGITS)))
  }

  /**
   * Does not mutate the current DAI instance.
   *
   * @param other Divisor
   * @returns New DAI instance
   */
  public divide(other: bigint) {
    return new DAI(this.state.divide(other)[0])
  }

  public gt(other: DAI) {
    return this.state.compare(other.state) === 1
  }

  public gte(other: DAI) {
    return this.state.compare(other.state) !== -1
  }

  public lt(other: DAI) {
    return this.state.compare(other.state) === -1
  }

  public lte(other: DAI) {
    return this.state.compare(other.state) !== 1
  }

  public eq(other: DAI) {
    return this.state.compare(other.state) === 0
  }
}
