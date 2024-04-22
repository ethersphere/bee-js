import { Types } from 'cafe-utility'

export const getStatusShape = {
    peer: Types.isHexString,
    beeMode: Types.isString,
    proximity: Types.isNumber,
    reserveSize: Types.isNumber,
    reserveSizeWithinRadius: Types.isNumber,
    pullsyncRate: Types.isNumber,
    storageRadius: Types.isNumber,
    connectedPeers: Types.isNumber,
    neighborhoodSize: Types.isNumber,
    batchCommitment: Types.isNumber,
    isReachable: Types.isBoolean,
}
