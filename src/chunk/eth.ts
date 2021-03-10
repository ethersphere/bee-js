import { Bytes, verifyBytes } from '../utils/bytes'
import { hexToBytes, assertHexString } from '../utils/hex'

export type EthAddress = Bytes<20>

export function makeEthAddress(owner: EthAddress | Uint8Array | string): EthAddress {
  if (typeof owner === 'string') {
    assertHexString<42>(owner, 42) // 20 bytes * 2 + 2 for prefix
    const ownerBytes = hexToBytes(owner)

    return verifyBytes(20, ownerBytes)
  } else if (owner instanceof Uint8Array) {
    return verifyBytes(20, owner)
  }
  throw new TypeError('invalid owner')
}
