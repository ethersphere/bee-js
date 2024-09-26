import { Types } from 'cafe-utility'
import { peerChequesShape } from './peer-cheques'

export const getChequebookChequeShape = {
  lastcheques: (x: any) => Types.enforceArrayShape(x, peerChequesShape),
}
