/**
 * Helper type for dealing with fixed size byte arrays.
 *
 * It changes the type of `length` property of `Uint8Array` to the
 * generic `Length` type parameter which is runtime compatible with
 * the original, because it extends from the `number` type.
 */
export interface Bytes<Length extends number> extends Uint8Array {
  readonly length: Length
}

/**
 * Helper type for dealing with flexible sized byte arrays.
 *
 * The actual min and and max values are not stored in runtime, they
 * are only there to differentiate the type from the Uint8Array at
 * compile time.
 * @see BrandedType
 */
export interface FlexBytes<Min extends number, Max extends number> extends Uint8Array {
  readonly __min__: Min
  readonly __max__: Max
}

/**
 * Type guard for Bytes<T> type
 *
 * @param length  The length of the byte array
 * @param b       The byte array
 */
export function isBytes<Length extends number>(length: Length, b: Uint8Array): b is Bytes<Length> {
  return b.length === length
}

/**
 * Verifies if a byte array has a certain length
 *
 * @param length  The specified length
 * @param b       The byte array
 */
export function verifyBytes<Length extends number>(length: Length, b: Uint8Array): Bytes<Length> | never {
  if (isBytes(length, b)) {
    return b
  }
  throw new Error(`verifyBytes failed, length: ${length} !== ${b.length}`)
}

/**
 * Type guard for FlexBytes<Min,Max> type
 *
 * @param min     Minimum size of the array
 * @param max     Maximum size of the array
 * @param b       The byte array
 */
export function isFlexBytes<Min extends number, Max extends number = Min>(
  min: Min,
  max: Max,
  b: Uint8Array,
): b is FlexBytes<Min, Max> {
  return b.length >= min && b.length <= max
}

/**
 * Verifies if a byte array has a certain length between min and max
 *
 * @param min     Minimum size of the array
 * @param max     Maximum size of the array
 * @param b       The byte array
 */
export function verifyFlexBytes<Min extends number, Max extends number = Min>(
  min: Min,
  max: Max,
  b: Uint8Array,
): FlexBytes<Min, Max> | never {
  if (isFlexBytes(min, max, b)) {
    return b
  }
  throw new Error(`verifyFlexBytes failed, min: ${min}, max: ${max}, length: ${b.length}`)
}

/**
 * Return `length` bytes starting from `offset`
 *
 * @param offset The offset to start from
 * @param length The length of data to be returned
 * @param data   The original data
 */
export function bytesAtOffset<Length extends number>(offset: number, length: Length, data: Uint8Array): Bytes<Length> {
  return data.slice(offset, offset + length) as Bytes<Length>
}

/**
 * Return flex bytes starting from `offset`
 *
 * @param offset The offset to start from
 * @param _min   The minimum size of the data
 * @param _max   The maximum size of the data
 * @param data   The original data
 */
export function flexBytesAtOffset<Min extends number, Max extends number>(
  offset: number,
  _min: Min,
  _max: Max,
  data: Uint8Array,
): FlexBytes<Min, Max> {
  return data.slice(offset) as FlexBytes<Min, Max>
}

/**
 * Returns true if two byte arrays are equal
 *
 * @param a Byte array to compare
 * @param b Byte array to compare
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export function makeBytes<Length extends number>(length: Length): Bytes<Length> {
  return new Uint8Array(length) as Bytes<Length>
}

export function verifyBytesAtOffset<Length extends number>(
  offset: number,
  length: Length,
  data: Uint8Array,
): Bytes<Length> {
  return verifyBytes(length, bytesAtOffset(offset, length, data))
}
