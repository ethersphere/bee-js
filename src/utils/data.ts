import type { Readable } from 'stream'
import type { Data } from 'ws'

export function prepareData(data: string | Uint8Array | Readable): Uint8Array | Readable {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data)
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
