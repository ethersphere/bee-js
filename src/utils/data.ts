import type { Data } from 'ws'
import WebSocket from 'isomorphic-ws'

function isBufferArray(buffer: unknown): buffer is Buffer[] {
  return Array.isArray(buffer) && buffer.length > 0 && buffer.every(data => data instanceof Buffer)
}

export async function prepareWebsocketData(data: Data | Blob): Promise<Uint8Array | never> {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  }

  if (data instanceof Buffer) {
    return new Uint8Array(data)
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  if (isBufferArray(data)) {
    return new Uint8Array(Buffer.concat(data))
  }

  throw new TypeError('unknown websocket data type')
}

export function prepareWebsocketConnection(params: string, headers?: Record<string, string>): WebSocket {
  return new WebSocket(params, { headers })
}
