import { Types } from 'cafe-utility'

export const peerShape = {
  address: Types.isHexString,
  fullNode: Types.isBoolean,
}
