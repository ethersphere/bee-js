import { Types } from 'cafe-utility'

export const getRedistributionstateShape = {
    minimumGasFunds: Types.isIntegerString,
    hasSufficientFunds: Types.isBoolean,
    isFrozen: Types.isBoolean,
    isFullySynced: Types.isBoolean,
    isHealthy: Types.isBoolean,
    phase: Types.isString,
    round: Types.isNumber,
    lastWonRound: Types.isNumber,
    lastPlayedRound: Types.isNumber,
    lastFrozenRound: Types.isNumber,
    lastSelectedRound: Types.isNumber,
    lastSampleDuration: Types.isString,
    block: Types.isNumber,
    reward: Types.isIntegerString,
    fees: Types.isIntegerString,
}
