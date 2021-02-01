import type { Readable } from 'stream'
import type { Data } from 'ws'

export function prepareData(
  data: string | ArrayBuffer | Uint8Array | Readable | ReadableStream,
): Uint8Array | Readable | ReadableStream {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  return data
}

export function prepareWebsocketData(data: Data): Uint8Array {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
  } else if (data instanceof Buffer) {
    return new Uint8Array(data)
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  } else {
    return new Uint8Array(Buffer.concat(data))
  }
}
