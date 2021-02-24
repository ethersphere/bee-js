import { keccak256, sha3_256 } from 'js-sha3'
import { BrandedString } from '../types'
import { HexString, hexToBytes, intToHex, isHexString, stripHexPrefix, verifyHex } from './hex'
export type EthAddress = BrandedString<'EthAddress'>
export type OverlayAddress = BrandedString<'OverlayAddress'>

/**
 * Check if is valid ethereum address
 *
 * Pretty much typed version from web3js
 * https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-utils/src/utils.js
 *
 * @param address  Ethereum address
 */
export function isEthAddress(address: string | HexString): address is EthAddress {
  if (typeof address !== 'string' || !/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    // Check if it has the basic requirements of an address - type string, pad 40 chars, numbers and letters a-f case insensitive
    return false
  } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
    // If it's all small caps or all all caps, return true
    return true
  } else {
    // Potentially a checksummed address
    const addr = stripHexPrefix(address)
    const addressHash = keccak256(addr.toLowerCase())
    for (let i = 0; i < 40; i += 1) {
      // the nth letter should be uppercase if the nth digit of casemap is 1
      if (
        (parseInt(addressHash[i], 16) > 7 && addr[i].toUpperCase() !== addr[i]) ||
        (parseInt(addressHash[i], 16) <= 7 && addr[i].toLowerCase() !== addr[i])
      ) {
        return false
      }
    }

    return true
  }
}

/**
 * Convert big-endian hex or number to little-endian.
 * Note: Before conversion it is automatically padded to even length hexstring
 *
 * @param bigEndian Big-endian hex string or number to convert
 * @param pad       Length to which the string should be padded before conversion (defaul: 2)
 */
export function toLittleEndian(bigEndian: number | string | HexString, pad = 2): HexString | never {
  if (!(Number.isInteger(pad) && pad >= 2 && pad % 2 === 0)) {
    throw new TypeError('minimal padding for conversion needs to be positive even integer')
  }

  let hexRep

  if (isHexString(bigEndian as string)) hexRep = stripHexPrefix<HexString>(bigEndian as HexString)
  else if (typeof bigEndian === 'number') hexRep = intToHex(bigEndian)
  else throw new TypeError('incorrect input type')

  hexRep = hexRep.padStart(pad, '0')

  // Extend to an even length hexstring
  if (hexRep.length % 2 !== 0) hexRep = hexRep.padStart(hexRep.length + 1, '0')

  // Match all two pairs in the hexstring, reverse the pairs and join it again
  const littleEndian = hexRep.match(/../g)?.reverse().join('')

  if (littleEndian) return littleEndian as HexString

  throw new Error('failed to convert')
}

/**
 * Convert little-endian hex or number to big-endian
 * Note: Before conversion it is automatically padded to even length hexstring
 *
 * @param littleEndian Little-endian hex string or number to convert
 * @param pad          Length to which the string should be padded before conversion (defaul: 2)
 */
export function fromLittleEndian(littleEndian: number | string | HexString, pad = 2): HexString | never {
  // It's a reversible function
  return toLittleEndian(littleEndian, pad)
}

/**
 *
 *
 * @param ethAddress
 * @param networkId
 */
export function ethToSwarmAddress(ethAddress: string | HexString | EthAddress, networkId = 1): OverlayAddress {
  const hex = verifyHex(`${stripHexPrefix(ethAddress)}${toLittleEndian(networkId, 16)}`)

  const overlayAddress = sha3_256(hexToBytes(hex))

  return overlayAddress as OverlayAddress
}
