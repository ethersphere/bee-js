import { verifyBytes } from '../utils/bytes'
import { hexToBytes, verifyHex } from '../utils/hex'
import { EthAddress } from './signer'

export type OwnerInput = EthAddress | Uint8Array | string
export type Owner = EthAddress

export function verifyOwner(owner: OwnerInput): Owner {
  if (typeof owner === 'string') {
    const hexOwner = verifyHex(owner)
    const ownerBytes = hexToBytes(hexOwner)

    return verifyBytes(20, ownerBytes)
  }

  return verifyBytes(20, owner)
}
