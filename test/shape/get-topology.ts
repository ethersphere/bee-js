import { Types } from 'cafe-utility'
import { topologyBinPropertyShape } from './topology-bin-property'
import { topologyBinsShape } from './topology-bins'

export const getTopologyShape = {
  baseAddr: Types.isHexString,
  population: Types.isNumber,
  connected: Types.isNumber,
  timestamp: Types.isString,
  nnLowWatermark: Types.isNumber,
  depth: Types.isNumber,
  reachability: Types.isString,
  networkAvailability: Types.isString,
  bins: (x: any) => Types.enforceObjectShape(x, topologyBinsShape),
  lightNodes: (x: any) => Types.enforceObjectShape(x, topologyBinPropertyShape),
}
