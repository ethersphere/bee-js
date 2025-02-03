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
}
