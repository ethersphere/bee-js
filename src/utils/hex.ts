/**
 * Nominal type to represent hex strings with '0x' prefix.
 * Given length includes prefix.
 * For example for 32 bytes hex representation you have to use 66 length.
 */
export type HexString<Length extends number = number> = string & {
  readonly length?: Length
  __tag__?: 'HexString'
}

export type NonPrefixedHexString<Length extends number = number> = string & {
  readonly length?: Length
  __tag__: 'NonPrefixedHexString'
}

/**
 * Strips the '0x' hex prefix from a string

 * @param prefixedHex
 */
export function stripHexPrefix<PrefixedL extends number, NonPrefixedL extends number>(
  prefixedHex: HexString<PrefixedL>,
): NonPrefixedHexString<NonPrefixedL> {
  assertHexString(prefixedHex)

  return prefixedHex.slice(2) as NonPrefixedHexString<NonPrefixedL>
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
 * @param length  Optional expected length of the HexString
 */
export function bytesToHex<Length extends number = number>(bytes: Uint8Array, length?: number): HexString<Length> {
  const hexByte = (n: number) => n.toString(16).padStart(2, '0')
  const hex = ('0x' + Array.from(bytes, hexByte).join('')) as HexString<Length>

  if (length && hex.length !== length) throw new TypeError(`the hex string is not expected length of ${length}`)

  return hex
}

/**
 * Converst integer number to hex string.
 *
 * Optionally provides '0x' prefix or padding
 *
 * @param int     The positive integer to be converted
 * @param length  Optional expected length of the HexString
 */
export function intToHex<Length extends number = number>(int: number, length?: number): HexString<Length> {
  if (!Number.isInteger(int)) throw new TypeError('the value provided is not integer')

  if (int > Number.MAX_SAFE_INTEGER) throw new TypeError('the value provided exceeds safe integer')

  if (int < 0) throw new TypeError('the value provided is a negative integer')
  const hex = ('0x' + int.toString(16)) as HexString<Length>

  if (length && hex.length !== length) throw new TypeError(`the hex string is not expected length of ${length}`)

  return hex
}

/**
 * Type guard for HexStrings.
 * Does enforce 0x prefix!
 *
 * @param s string input
 * @param len expected length of the HexString
 */
export function isHexString<Length extends number = number>(s: unknown, len?: number): s is HexString<Length> {
  return typeof s === 'string' && /^0x[0-9a-f]+$/i.test(s) && (!len || s.length === len)
}

/**
 * Type guard for NonPrefixedHexStrings.
 * Does enforce not presence of 0x prefix!
 *
 * @param s string input
 * @param len expected length of the HexString
 */
export function isNonPrefixedHexString<Length extends number = number>(
  s: unknown,
  len?: number,
): s is NonPrefixedHexString<Length> {
  return typeof s === 'string' && /^[0-9a-f]+$/i.test(s) && (!len || s.length === len)
}

/**
 * Verifies if the provided input is a HexString.
 *
 * @param s string input
 * @param len expected length of the HexString
 * @throws throws error if not valid hex string is passed
 */
export function assertHexString<Length extends number = number>(
  s: string,
  len?: number,
): asserts s is HexString<Length> {
  if (!isHexString(s, len)) {
    // If we are testing for prefixed length, than non-prefixed length
    // would be 2 chars shorter.
    if (isNonPrefixedHexString(s, len ? len - 2 : len)) {
      throw new Error(`Not valid hex string of length ${len} (most probably forgot 0x prefix): ${s}`)
    }

    throw new Error(`Not valid hex string of length ${len} (including prefix): ${s}`)
  }
}

/**
 * Verifies if the provided input is a NonPrefixedHexString.
 *
 * @param s string input
 * @param len expected length of the NonPrefixedHexString
 * @throws throws error if not valid hex string is passed
 */
export function assertNonPrefixedHexString<Length extends number = number>(
  s: string,
  len?: number,
): asserts s is NonPrefixedHexString<Length> {
  if (!isNonPrefixedHexString(s, len)) {
    if (s.startsWith('0x')) {
      throw new Error(`Not valid non-prefixed hex string of length ${len} (has a prefix!): ${s}`)
    }
    throw new Error(`Not valid non-prefixed hex string of length ${len}: ${s}`)
  }
}
