import { Types } from 'cafe-utility'

export const peerMetricsShape = {
  lastSeenTimestamp: Types.isNumber,
  sessionConnectionRetry: Types.isNumber,
  connectionTotalDuration: Types.isNumber,
  sessionConnectionDuration: Types.isNumber,
  sessionConnectionDirection: Types.isString,
  latencyEWMA: Types.isNumber,
  reachability: Types.isString,
  healthy: Types.isBoolean,
}
