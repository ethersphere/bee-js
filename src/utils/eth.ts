import { keccak256, sha3_256 } from 'js-sha3'
import { BrandedString } from '../types'
import { HexString, hexToBytes, intToHex, isHexString, stripHexPrefix, verifyHex } from './hex'
export type HexEthAddress = BrandedString<'HexEthAddress'>
export type OverlayAddress = BrandedString<'OverlayAddress'>

/**
 * Check if this is all caps or small caps eth address (=address without checksum)
 *
 * @param address Ethereum address as hex string
 */
function isEthAddrCaseIns(address: string | HexString | HexEthAddress): address is HexEthAddress {
  // Check it's string, all small caps or all all caps hex and 40 chars long without the `0x` prefix
  return (
    typeof address === 'string' && (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address))
  )
}

/**
 * Check if this is checksummed ethereum address
 *
 * @param address Ethereum address as hex string
 */
function isValidChecksummedEthAddress(address: string | HexString | HexEthAddress): address is HexEthAddress {
  // Does not meet basic requirements of an address - type string, 40 chars, case insensitive hex numbers
  if (typeof address !== 'string' && !/^(0x)?[0-9a-f]{40}$/i.test(address)) return false

  // Check the checksum
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

/**
 * Check if is valid ethereum address
 *
 * Pretty much typed version from web3js
 * https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-utils/src/utils.js
 *
 * @param address  Ethereum address as hex string
 *
 * @return True if is valid eth address
 */
export function isEthAddress(address: string | HexString | HexEthAddress): address is HexEthAddress {
  return isEthAddrCaseIns(address) || isValidChecksummedEthAddress(address)
}

/**
 * Convert big-endian hex or number to little-endian.
 * Note: Before conversion it is automatically padded to even length hexstring
 *
 * @param bigEndian Big-endian hex string or number to convert
 * @param pad       Length to which the string should be padded before conversion (defaul: 2)
 *
 * @return little-endian encoded hexstring
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
 *
 * @return big-endian encoded hexstring
 */
export function fromLittleEndian(littleEndian: number | string | HexString, pad = 2): HexString | never {
  // It's a reversible function
  return toLittleEndian(littleEndian, pad)
}

function assertIsEthAddress(ethAddress: string | HexString | HexEthAddress): asserts ethAddress is HexEthAddress {
  if (!isEthAddress(ethAddress)) throw new TypeError('invalid ETH address')
}

function assertIsSwarmNetworkId(networkId: number): asserts networkId is number {
  if (Number.isInteger(networkId && networkId > 0 && networkId < Number.MAX_SAFE_INTEGER)) {
    throw new TypeError('swarm network id must be positive integer')
  }
}

/**
 * Get swarm overlay address from public ethereum address and swarm network id
 *
 * @param ethAddress  Public ethereum address
 * @param networkId   Swarm network id
 *
 * @return Swarm overlay address
 */
export function ethToSwarmAddress(ethAddress: string | HexString | HexEthAddress, networkId = 1): OverlayAddress {
  assertIsEthAddress(ethAddress)
  assertIsSwarmNetworkId(networkId)

  const hex = verifyHex(`${stripHexPrefix(ethAddress)}${toLittleEndian(networkId, 16)}`)

  const overlayAddress = sha3_256(hexToBytes(hex))

  return overlayAddress as OverlayAddress
}
