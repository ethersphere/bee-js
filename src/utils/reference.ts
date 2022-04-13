import {
  BytesReference,
  ENCRYPTED_REFERENCE_BYTES_LENGTH,
  ENCRYPTED_REFERENCE_HEX_LENGTH,
  Reference,
  REFERENCE_BYTES_LENGTH,
  REFERENCE_HEX_LENGTH,
} from '../types'
import { bytesAtOffset } from './bytes'
import { hexToBytes, makeHexString } from './hex'

export function makeBytesReference(reference: Uint8Array | BytesReference | Reference, offset = 0): BytesReference {
  if (typeof reference === 'string') {
    if (offset) {
      throw new Error('Offset property can be set only for UintArray reference!')
    }

    try {
      // Non-encrypted chunk hex string reference
      const hexReference = makeHexString(reference, REFERENCE_HEX_LENGTH)

      return hexToBytes<typeof REFERENCE_BYTES_LENGTH>(hexReference)
    } catch (e) {
      if (!(e instanceof TypeError)) {
        throw e
      }

      // Encrypted chunk hex string reference
      const hexReference = makeHexString(reference, ENCRYPTED_REFERENCE_HEX_LENGTH)

      return hexToBytes<typeof ENCRYPTED_REFERENCE_BYTES_LENGTH>(hexReference)
    }
  } else if (reference instanceof Uint8Array) {
    try {
      return bytesAtOffset(reference, offset, ENCRYPTED_REFERENCE_BYTES_LENGTH)
    } catch (e) {
      return bytesAtOffset(reference, offset, REFERENCE_BYTES_LENGTH)
    }
  }
  throw new TypeError('invalid chunk reference')
}
