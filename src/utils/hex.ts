export type BrandedType<T, N> = T & { __tag__: N }
export type BrandedString<N> = BrandedType<string, N>

export type FlavoredType<T, N> = T & { __tag__?: N }

export type HexString = BrandedString<'HexString'>

export function stripHexPrefix(hex: HexString): HexString {
  return hex.startsWith('0x') ? (hex.slice(2) as HexString) : hex
}

export function hexToByteArray(hex: HexString): number[] {
  const hexWithoutPrefix = stripHexPrefix(hex)
  const subStrings: string[] = []
  for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
    subStrings.push(hexWithoutPrefix.substr(i, 2))
  }

  return subStrings.map(s => parseInt(s, 16))
}

export function hexToUint8Array(hex: HexString): Uint8Array {
  return new Uint8Array(hexToByteArray(hex))
}

export function byteArrayToHex(byteArray: number[] | Uint8Array, withPrefix = false): HexString {
  const prefix = withPrefix ? '0x' : ''

  return (prefix +
    Array.from(byteArray, byte => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')) as HexString
}
