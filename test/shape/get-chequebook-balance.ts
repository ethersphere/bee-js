import { Types } from 'cafe-utility'

export const getChequebookBalanceShape = {
    totalBalance: Types.isIntegerString,
    availableBalance: Types.isIntegerString,
}
