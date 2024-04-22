import { Types } from 'cafe-utility'
import { paymentShape } from './payment'

export const peerChequesShape = {
    peer: Types.isHexString,
    lastreceived: (someObject: any) => Types.isNullable((x: any) => Types.enforceObjectShape(x, paymentShape), someObject),
    lastsent: (someObject: any) => Types.isNullable((x: any) => Types.enforceObjectShape(x, paymentShape), someObject),
}
