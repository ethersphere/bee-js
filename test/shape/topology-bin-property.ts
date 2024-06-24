import { Types } from 'cafe-utility'
import { peerWithMetricsShape } from './peer-with-metrics'

export const topologyBinPropertyShape = {
  population: Types.isNumber,
  connected: Types.isNumber,
  disconnectedPeers: (someArray: any) =>
    Types.isNullable((x: any) => Types.enforceArrayShape(x, peerWithMetricsShape), someArray),
  connectedPeers: (someArray: any) =>
    Types.isNullable((x: any) => Types.enforceArrayShape(x, peerWithMetricsShape), someArray),
}
