import { keccak256, Message } from 'js-sha3'
import { Bytes } from './bytes'

/**
 * Helper function for calculating the keccak256 hash with
 * correct types.
 *
 * @param messages Any number of messages (strings, byte arrays etc.)
 */
export function keccak256Hash(...messages: Message[]): Bytes<32> {
  const hasher = keccak256.create()

  messages.forEach(bytes => hasher.update(bytes))

  return Uint8Array.from(hasher.digest()) as Bytes<32>
}
