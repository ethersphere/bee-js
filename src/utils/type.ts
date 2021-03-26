import { ENCRYPTED_REFERENCE_HEX_LENGTH, Reference, REFERENCE_HEX_LENGTH } from '../types'
import { assertHexString } from './hex'

export function isInteger(value: unknown): value is number | BigInt {
  return (
    typeof value === 'bigint' ||
    (typeof value === 'number' &&
      value > Number.MIN_SAFE_INTEGER &&
      value < Number.MAX_SAFE_INTEGER &&
      Number.isInteger(value))
  )
}

export function assertInteger(value: unknown): asserts value is number | BigInt {
  if (!isInteger(value)) throw new TypeError('value is not integer')
}

export function assertReference(value: unknown): asserts value is Reference {
  try {
    assertHexString(value, REFERENCE_HEX_LENGTH)
  } catch (e) {
    assertHexString(value, ENCRYPTED_REFERENCE_HEX_LENGTH)
  }
}
