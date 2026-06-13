import { System } from 'cafe-utility'
import WebSocket from 'isomorphic-ws'
import { uploadSingleOwnerChunk } from '../chunk/soc'
import { EthAddress } from '../utils/typed-bytes'

const endpoint = 'mic'

export { uploadSingleOwnerChunk as send }

export function subscribe(url: string, owner: EthAddress, headers?: Record<string, string>) {
  const wsUrl = url.replace(/^http/i, 'ws')

  if (System.whereAmI() === 'browser') {
    return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${owner.toHex()}`)
  }

  return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${owner.toHex()}`, {
    headers,
  })
}
