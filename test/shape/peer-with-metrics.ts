import { Types } from 'cafe-utility'
import { peerMetricsShape } from './peer-metrics'

export const peerWithMetricsShape = {
    address: Types.isHexString,
    metrics: (someObject: any) => Types.isNullable((x: any) => Types.enforceObjectShape(x, peerMetricsShape), someObject),
}
