import { Types } from 'cafe-utility'
import { peerWithBalanceShape } from './peer-with-balance'

export const getBalancesShape = {
  balances: (x: any) => Types.enforceArrayShape(x, peerWithBalanceShape),
}
