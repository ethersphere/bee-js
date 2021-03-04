import type { Readable } from 'stream'
import type { Data } from 'ws'

export function prepareData(data: string | ArrayBuffer | Uint8Array | Readable): Uint8Array | Readable {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  return data
}

function isBufferArray(data: unknown) {
  return Array.isArray(data) && data.length > 0 && data.reduce((p, c) => p && c instanceof Buffer, true)
}

export async function prepareWebsocketData(data: Data | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  } else if (data instanceof Buffer) {
    return new Uint8Array(data)
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  } else if (data instanceof Blob) {
    return new Uint8Array(await new Response(data as Blob).arrayBuffer())
  } else if (isBufferArray(data)) {
    return new Uint8Array(Buffer.concat(data))
  }

  throw new TypeError('unknown websocket data type')
}
