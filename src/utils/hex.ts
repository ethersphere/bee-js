import { BrandedString } from '../types'

/**
 * Nominal type to represent hex strings
 */
export type HexString = BrandedString<'HexString'>

/**
 * Strips the '0x' hex prefix from a string

 * @param hex string input
 */
export function stripHexPrefix<T extends string>(hex: T): T {
  return hex.startsWith('0x') ? (hex.slice(2) as T) : hex
}

/**
 * Converts a hex string to Uint8Array
 *
 * @param hex string input
 */
export function hexToBytes(hex: HexString): Uint8Array {
  const hexWithoutPrefix = stripHexPrefix(hex)
  const bytes = new Uint8Array(hexWithoutPrefix.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hexWithoutPrefix.substr(i * 2, 2)
    bytes[i] = parseInt(hexByte, 16)
  }

  return bytes
}

/**
 * Converts array of number or Uint8Array to hex string.
 *
 * Optionally provides '0x' prefix.
 *
 * @param bytes       The input array
 * @param withPrefix  Provides '0x' prefix when true (default: false)
 */
export function bytesToHex(bytes: Uint8Array, withPrefix = false): HexString {
  const prefix = withPrefix ? '0x' : ''
  const hexByte = (n: number) => n.toString(16).padStart(2, '0')
  const hex = Array.from(bytes, hexByte).join('')

  return `${prefix}${hex}` as HexString
}

/**
 * Converst integer number to hex string.
 *
 * Optionally provides '0x' prefix or padding
 *
 * @param int         The positive integer to be converted
 * @param withPrefix  Provides '0x' prefix when true (default: false)
 */
export function intToHex(int: number, withPrefix = false): HexString {
  if (!Number.isInteger(int)) throw new TypeError('the value provided is not integer')

  if (int > Number.MAX_SAFE_INTEGER) throw new TypeError('the value provided exceeds safe integer')

  if (int < 0) throw new TypeError('the value provided is a negative integer')
  const prefix = withPrefix ? '0x' : ''
  const hex = int.toString(16)

  return `${prefix}${hex}` as HexString
}

/**
 * Type guard for HexStrings
 *
 * @param s string input
 */
export function isHexString(s: string): s is HexString {
  return typeof s === 'string' && /^(0x)?[0-9a-f]+$/i.test(s)
}

/**
 * Verifies if the provided input is a HexString.
 *
 * @param s string input
 *
 * @returns HexString or throws error
 */
export function verifyHex(s: string): HexString | never {
  if (isHexString(s)) {
    return s
  }
  throw new Error(`verifyHex: not valid hex string: ${s}`)
}
