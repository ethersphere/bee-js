import { makeBytes } from './bytes'
import type { Bytes } from '../utils/bytes'
import type { BrandedType, FlavoredType } from '../types'

/**
 * Nominal type to represent hex strings WITHOUT '0x' prefix.
 * For example for 32 bytes hex representation you have to use 64 length.
 * TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
 */
export type HexString<Length extends number = number> = FlavoredType<
  string & {
    readonly length: Length
  },
  'HexString'
>

/**
 * Type for HexString with prefix.
 * The main hex type used internally should be non-prefixed HexString
 * and therefore this type should be used as least as possible.
 * Because of that it does not contain the Length property as the variables
 * should be validated and converted to HexString ASAP.
 */
export type PrefixedHexString = BrandedType<string, 'PrefixedHexString'>

/**
 * Creates unprefixed hex string from wide range of data.
 *
 * TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
 *
 * @param input
 * @param len of the resulting HexString WITHOUT prefix!
 */
export function makeHexString<L extends number>(input: string | number | Uint8Array | unknown, len?: L): HexString<L> {
  if (typeof input === 'number') {
    return intToHex<L>(input, len)
  }

  if (input instanceof Uint8Array) {
    return bytesToHex<L>(input, len)
  }

  if (typeof input === 'string') {
    if (isPrefixedHexString(input)) {
      const hex = input.slice(2) as HexString<L>

      if (len && hex.length !== len) {
        throw new TypeError(`Length mismatch for valid hex string. Expecting length ${len}: ${hex}`)
      }

      return hex
    } else {
      // We use assertHexString() as there might be more reasons why a string is not valid hex string
      // and usage of isHexString() would not give enough information to the user on what is going
      // wrong.
      assertHexString<L>(input, len)

      return input
    }
  }

  throw new TypeError('Not HexString compatible type!')
}

/**
 * Converts a hex string to Uint8Array
 *
 * @param hex string input without 0x prefix!
 */
export function hexToBytes<Length extends number, LengthHex extends number = number>(
  hex: HexString<LengthHex>,
): Bytes<Length> {
  assertHexString(hex)

  const bytes = makeBytes(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2)
    bytes[i] = parseInt(hexByte, 16)
  }

  return bytes as Bytes<Length>
}

/**
 * Converts array of number or Uint8Array to HexString without prefix.
 *
 * @param bytes   The input array
 * @param len     The length of the non prefixed HexString
 */
export function bytesToHex<Length extends number = number>(bytes: Uint8Array, len?: Length): HexString<Length> {
  const hexByte = (n: number) => n.toString(16).padStart(2, '0')
  const hex = Array.from(bytes, hexByte).join('') as HexString<Length>

  // TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
  if (len && hex.length !== len) {
    throw new TypeError(`Resulting HexString does not have expected length ${len}: ${hex}`)
  }

  return hex
}

/**
 * Converts integer number to hex string.
 *
 * Optionally provides '0x' prefix or padding
 *
 * @param int         The positive integer to be converted
 * @param len     The length of the non prefixed HexString
 */
export function intToHex<Length extends number = number>(int: number, len?: Length): HexString<Length> {
  if (!Number.isInteger(int)) throw new TypeError('the value provided is not integer')

  if (int > Number.MAX_SAFE_INTEGER) throw new TypeError('the value provided exceeds safe integer')

  if (int < 0) throw new TypeError('the value provided is a negative integer')
  const hex = int.toString(16) as HexString<Length>

  // TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
  if (len && hex.length !== len) {
    throw new TypeError(`Resulting HexString does not have expected length ${len}: ${hex}`)
  }

  return hex
}

/**
 * Type guard for HexStrings.
 * Requires no 0x prefix!
 *
 * TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
 *
 * @param s string input
 * @param len expected length of the HexString
 */
export function isHexString<Length extends number = number>(s: unknown, len?: number): s is HexString<Length> {
  return typeof s === 'string' && /^[0-9a-f]+$/i.test(s) && (!len || s.length === len)
}

/**
 * Type guard for PrefixedHexStrings.
 * Does enforce presence of 0x prefix!
 *
 * @param s string input
 */
export function isPrefixedHexString(s: unknown): s is PrefixedHexString {
  return typeof s === 'string' && /^0x[0-9a-f]+$/i.test(s)
}

/**
 * Verifies if the provided input is a HexString.
 *
 * TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
 *
 * @param s string input
 * @param len expected length of the HexString
 * @param name optional name for the asserted value
 * @returns HexString or throws error
 */
export function assertHexString<Length extends number = number>(
  s: unknown,
  len?: number,
  name = 'value',
): asserts s is HexString<Length> {
  if (!isHexString(s, len)) {
    if (isPrefixedHexString(s)) {
      throw new TypeError(`${name} not valid non prefixed hex string (has 0x prefix): ${s}`)
    }

    // Don't display length error if no length specified in order not to confuse user
    const lengthMsg = len ? ` of length ${len}` : ''
    throw new TypeError(`${name} not valid hex string${lengthMsg}: ${s}`)
  }
}

/**
 * Verifies if the provided input is a PrefixedHexString.
 *
 * @param s string input
 * @param len expected length of the HexString
 * @param name optional name for the asserted value
 * @returns HexString or throws error
 */
export function assertPrefixedHexString(s: string, name = 'value'): asserts s is PrefixedHexString {
  if (!isPrefixedHexString(s)) {
    throw new TypeError(`${name} not valid prefixed hex string: ${s}`)
  }
}
