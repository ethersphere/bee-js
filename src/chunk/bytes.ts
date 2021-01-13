import { BeeArgumentError } from '../utils/error'

export interface Bytes<Length extends number> extends Uint8Array {
  readonly length: Length
}

export interface FlexBytes<Min extends number, Max extends number> extends Uint8Array {
  readonly __min__: Min
  readonly __max__: Max
}

export function isBytes<Length extends number>(b: Uint8Array, length: Length): b is Bytes<Length> {
  return b.length === length
}

export function verifyBytes<Length extends number>(b: Uint8Array, length: Length): Bytes<Length> {
  if (isBytes(b, length)) {
    return b
  }
  throw new BeeArgumentError(`verifyBytes failed, length: ${length}`, b)
}

export function verifyFlexBytes<Min extends number, Max extends number = Min>(
  b: Uint8Array,
  min: Min,
  max: Max,
): FlexBytes<Min, Max> {
  if (b.length >= min && b.length <= max) {
    return b as FlexBytes<Min, Max>
  }
  throw new BeeArgumentError(`verifyBytes failed, length: ${length}`, b)
}
