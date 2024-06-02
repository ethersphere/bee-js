import { Types } from 'cafe-utility'

export const getHealthShape = {
  status: Types.isString,
  version: Types.isString,
  apiVersion: Types.isString,
}
