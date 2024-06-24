import { Types } from 'cafe-utility'

export const getChainstateShape = {
  chainTip: Types.isNumber,
  block: Types.isNumber,
  totalAmount: Types.isIntegerString,
  currentPrice: Types.isIntegerString,
}
