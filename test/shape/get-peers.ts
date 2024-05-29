import { Types } from 'cafe-utility'
import { peerShape } from './peer'

export const getPeersShape = {
  peers: (x: any) => Types.enforceArrayShape(x, peerShape),
}
