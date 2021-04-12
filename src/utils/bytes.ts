/**
 * Helper type for dealing with fixed size byte arrays.
 *
 * It changes the type of `length` property of `Uint8Array` to the
 * generic `Length` type parameter which is runtime compatible with
 * the original, because it extends from the `number` type.
 */
import { Data } from '../types'
import { bytesToHex } from './hex'

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
 * @param b       The byte array
 * @param length  The length of the byte array
 */
export function isBytes<Length extends number>(b: unknown, length: Length): b is Bytes<Length> {
  return b instanceof Uint8Array && b.length === length
}

/**
 * Verifies if a byte array has a certain length
 *
 * @param b       The byte array
 * @param length  The specified length
 */
export function assertBytes<Length extends number>(b: unknown, length: Length): asserts b is Bytes<Length> {
  if (!isBytes(b, length)) {
    throw new TypeError(`Parameter is not valid Bytes of length: ${length} !== ${(b as Uint8Array).length}`)
  }
}

/**
 * Type guard for FlexBytes<Min,Max> type
 *
 * @param b       The byte array
 * @param min     Minimum size of the array
 * @param max     Maximum size of the array
 */
export function isFlexBytes<Min extends number, Max extends number = Min>(
  b: unknown,
  min: Min,
  max: Max,
): b is FlexBytes<Min, Max> {
  return b instanceof Uint8Array && b.length >= min && b.length <= max
}

/**
 * Verifies if a byte array has a certain length between min and max
 *
 * @param b       The byte array
 * @param min     Minimum size of the array
 * @param max     Maximum size of the array
 */
export function assertFlexBytes<Min extends number, Max extends number = Min>(
  b: unknown,
  min: Min,
  max: Max,
): asserts b is FlexBytes<Min, Max> {
  if (!isFlexBytes(b, min, max)) {
    throw new TypeError(
      `Parameter is not valid FlexBytes of  min: ${min}, max: ${max}, length: ${(b as Uint8Array).length}`,
    )
  }
}

/**
 * Return `length` bytes starting from `offset`
 *
 * @param data   The original data
 * @param offset The offset to start from
 * @param length The length of data to be returned
 */
export function bytesAtOffset<Length extends number>(data: Uint8Array, offset: number, length: Length): Bytes<Length> {
  const offsetBytes = data.slice(offset, offset + length) as Bytes<Length>

  // We are returning strongly typed Bytes so we have to verify that length is really what we claim
  assertBytes<Length>(offsetBytes, length)

  return offsetBytes
}

/**
 * Return flex bytes starting from `offset`
 *
 * @param data   The original data
 * @param offset The offset to start from
 * @param _min   The minimum size of the data
 * @param _max   The maximum size of the data
 */
export function flexBytesAtOffset<Min extends number, Max extends number>(
  data: Uint8Array,
  offset: number,
  _min: Min,
  _max: Max,
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

/**
 * Returns a new byte array filled with zeroes with the specified length
 *
 * @param length The length of data to be returned
 */
export function makeBytes<Length extends number>(length: Length): Bytes<Length> {
  return new Uint8Array(length) as Bytes<Length>
}

export function wrapBytesWithHelpers(data: Uint8Array): Data {
  return Object.assign(data, {
    text: () => new TextDecoder('utf-8').decode(data),
    json: () => JSON.parse(new TextDecoder('utf-8').decode(data)),
    hex: () => bytesToHex(data),
  })
}
