import { Types } from 'cafe-utility'

export const settlementShape = {
  peer: Types.isHexString,
  received: Types.isIntegerString,
  sent: Types.isIntegerString,
}
