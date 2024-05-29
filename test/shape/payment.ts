import { Types } from 'cafe-utility'

export const paymentShape = {
  beneficiary: Types.isHexString,
  chequebook: Types.isHexString,
  payout: Types.isIntegerString,
}
