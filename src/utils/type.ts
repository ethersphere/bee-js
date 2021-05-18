import { Address, ADDRESS_HEX_LENGTH, ENCRYPTED_REFERENCE_HEX_LENGTH, Reference, REFERENCE_HEX_LENGTH } from '../types'
import { assertHexString } from './hex'
import { BeeArgumentError } from './error'

export function isInteger(value: unknown): value is number | bigint {
  return (
    typeof value === 'bigint' ||
    (typeof value === 'number' &&
      value > Number.MIN_SAFE_INTEGER &&
      value < Number.MAX_SAFE_INTEGER &&
      Number.isInteger(value))
  )
}

export function assertInteger(value: unknown): asserts value is number | bigint {
  if (!isInteger(value)) throw new TypeError('value is not integer')
}

export function assertNonNegativeInteger(value: unknown): asserts value is number | bigint {
  assertInteger(value)

  if (value < 0) throw new BeeArgumentError('value has to be bigger or equal to zero', value)
}

export function assertReference(value: unknown): asserts value is Reference {
  try {
    assertHexString(value, REFERENCE_HEX_LENGTH)
  } catch (e) {
    assertHexString(value, ENCRYPTED_REFERENCE_HEX_LENGTH)
  }
}

export function assertAddress(value: unknown): asserts value is Address {
  assertHexString(value, ADDRESS_HEX_LENGTH)
}
