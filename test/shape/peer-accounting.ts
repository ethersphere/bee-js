import { Types } from 'cafe-utility'

export const peerAccountingShape = {
  balance: Types.isIntegerString,
  thresholdReceived: Types.isIntegerString,
  thresholdGiven: Types.isIntegerString,
  surplusBalance: Types.isIntegerString,
  reservedBalance: Types.isIntegerString,
  shadowReservedBalance: Types.isIntegerString,
  ghostBalance: Types.isIntegerString,
}
