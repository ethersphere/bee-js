import { System } from 'cafe-utility'
import WebSocket from 'isomorphic-ws'
import { uploadSingleOwnerChunk } from '../chunk/soc'
import { Identifier } from '../utils/typed-bytes'

const endpoint = 'moc'

export { uploadSingleOwnerChunk as send }

export function subscribe(url: string, identifier: Identifier, headers?: Record<string, string>) {
  const wsUrl = url.replace(/^http/i, 'ws')

  if (System.whereAmI() === 'browser') {
    return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${identifier.toHex()}`)
  }

  return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${identifier.toHex()}`, {
    headers,
  })
}
