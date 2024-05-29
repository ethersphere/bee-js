import { Types } from 'cafe-utility'

export const peerWithBalanceShape = {
  peer: Types.isHexString,
  balance: Types.isIntegerString,
  thresholdreceived: (x: any) => Types.isNullable(Types.isIntegerString, x),
  thresholdgiven: (x: any) => Types.isNullable(Types.isIntegerString, x),
}
