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
 * Converts a hex string to array of numbers
 *
 * @param hex string input
 */
export function hexToByteArray(hex: HexString): number[] {
  const hexWithoutPrefix = stripHexPrefix(hex)
  const subStrings: string[] = []
  for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
    subStrings.push(hexWithoutPrefix.substr(i, 2))
  }

  return subStrings.map(s => parseInt(s, 16))
}

/**
 * Converts a hex string to Uint8Array
 *
 * @param hex string input
 */
export function hexToUint8Array(hex: HexString): Uint8Array {
  return new Uint8Array(hexToByteArray(hex))
}

/**
 * Converts array of number or Uint8Array to hex string.
 *
 * Optionally provides a the '0x' prefix.
 *
 * @param byteArray   The input array
 * @param withPrefix  Provides '0x' prefix when true (default: false)
 */
export function byteArrayToHex(byteArray: number[] | Uint8Array, withPrefix = false): HexString {
  const prefix = withPrefix ? '0x' : ''

  return (prefix +
    Array.from(byteArray, byte => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')) as HexString
}

/**
 * Type guard for HexStrings
 *
 * @param s string input
 */
export function isHexString(s: string): s is HexString {
  return /^(0x)?[0-9a-fA-F]+$/i.test(s)
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
