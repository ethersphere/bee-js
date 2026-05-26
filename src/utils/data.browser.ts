import type { Data } from 'ws'
import WebSocket from 'isomorphic-ws'

export async function prepareWebsocketData(data: Data | string | ArrayBuffer | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  if (data instanceof Blob) {
    return new Uint8Array(await new Response(data as Blob).arrayBuffer())
  }

  throw new TypeError('unknown websocket data type')
}

export function prepareWebsocketConnection(params: string): WebSocket {
  return new WebSocket(params)
}
