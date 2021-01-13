import { keccak256, Message } from 'js-sha3'
import { Bytes } from './bytes'

export function keccak256Hash(...messages: Message[]): Bytes<32> {
  const hasher = keccak256.create()

  messages.forEach(bytes => hasher.update(bytes))

  return Uint8Array.from(hasher.digest()) as Bytes<32>
}
