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

export function verifyBytes<Length extends number>(b: Uint8Array, length: Length): Bytes<Length> | never {
  if (isBytes(b, length)) {
    return b
  }
  throw new Error(`verifyBytes failed, length: ${length} !== ${b.length}`)
}

export function verifyFlexBytes<Min extends number, Max extends number = Min>(
  b: Uint8Array,
  min: Min,
  max: Max,
): FlexBytes<Min, Max> | never {
  if (b.length >= min && b.length <= max) {
    return b as FlexBytes<Min, Max>
  }
  throw new Error(`verifyFlexBytes failed, min: ${min}, max: ${max}, length: ${b.length}`)
}
