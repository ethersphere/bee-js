import { Types } from 'cafe-utility'

export const globalStampShape = {
    batchID: Types.isHexString,
    value: Types.isIntegerString,
    start: Types.isNumber,
    depth: Types.isNumber,
    bucketDepth: Types.isNumber,
    immutable: Types.isBoolean,
    batchTTL: Types.isNumber,
    owner: Types.isHexString,
}
