import { Types } from 'cafe-utility'
import { stampShape } from './stamp'

export const getStampsShape = {
    stamps: (x: any) => Types.enforceArrayShape(x, stampShape),
}
