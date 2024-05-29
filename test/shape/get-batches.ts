import { Types } from 'cafe-utility'
import { globalStampShape } from './global-stamp'

export const getBatchesShape = {
  batches: (x: any) => Types.enforceArrayShape(x, globalStampShape),
}
