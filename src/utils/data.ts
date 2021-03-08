import { Readable } from 'stream'
import type { Data } from 'ws'

export function prepareData(data: string | ArrayBuffer | Uint8Array | Readable): Uint8Array | Readable {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  if (data instanceof Uint8Array || data instanceof Readable) return data

  throw new TypeError('unknown data type')
}

function isBufferArray(buffer: unknown): buffer is Buffer[] {
  return Array.isArray(buffer) && buffer.length > 0 && buffer.every(data => data instanceof Buffer)
}

export async function prepareWebsocketData(data: Data | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  if (data instanceof Buffer) return new Uint8Array(data)

  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  if (data instanceof Blob) return new Uint8Array(await new Response(data as Blob).arrayBuffer())

  if (isBufferArray(data)) return new Uint8Array(Buffer.concat(data))

  throw new TypeError('unknown websocket data type')
}
