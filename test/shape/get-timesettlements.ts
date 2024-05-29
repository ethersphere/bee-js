import { Types } from 'cafe-utility'
import { settlementShape } from './settlement'

export const getTimesettlementsShape = {
  totalReceived: Types.isIntegerString,
  totalSent: Types.isIntegerString,
  settlements: (x: any) => Types.enforceArrayShape(x, settlementShape),
}
