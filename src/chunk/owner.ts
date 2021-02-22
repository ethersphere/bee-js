import { verifyBytes } from '../utils/bytes'
import { hexToBytes, verifyHex } from '../utils/hex'
import { EthAddress } from './signer'

export type OwnerInput = EthAddress | Uint8Array | string
export type Owner = EthAddress

export function makeOwner(owner: OwnerInput): Owner {
  if (typeof owner === 'string') {
    const hexOwner = verifyHex(owner)
    const ownerBytes = hexToBytes(hexOwner)

    return verifyBytes(20, ownerBytes)
  } else if (owner instanceof Uint8Array) {
    return verifyBytes(20, owner)
  }
  throw new TypeError('invalid owner')
}
