import type { Readable } from 'stream'

export function prepareData(data: string | ArrayBuffer | Uint8Array | Readable): Uint8Array | Readable {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  return data
}

export async function prepareWebsocketData(data: string | ArrayBuffer | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  } else if (data instanceof Blob) {
    return new Uint8Array(await new Response(data as Blob).arrayBuffer())
  }

  throw new TypeError('unknown websocket data type')
}
