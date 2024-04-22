import { Types } from 'cafe-utility'

export const stampShape = {
    batchID: Types.isHexString,
    utilization: Types.isNumber,
    usable: Types.isBoolean,
    label: Types.isString,
    depth: Types.isNumber,
    amount: Types.isIntegerString,
    bucketDepth: Types.isNumber,
    blockNumber: Types.isNumber,
    immutableFlag: Types.isBoolean,
    exists: Types.isBoolean,
    batchTTL: Types.isNumber,
}
