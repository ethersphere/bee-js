import { isNodeReadable, isReadableStream } from './stream.js'
import Blob from 'cross-blob'

import type { Readable } from '../types/index.js'

/**
 * Validates input and converts to Uint8Array
 *
 * @param data any string, ArrayBuffer or Uint8Array
 */
export async function prepareData(
  data: string | Blob | ArrayBuffer | Uint8Array | Readable,
): Promise<Blob | ReadableStream<Uint8Array> | never> {
  if (typeof data === 'string') return new Blob([data], { type: 'text/plain' })

  if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    return new Blob([data], { type: 'application/octet-stream' })
  }

  if (data instanceof Blob) {
    return data
  }

  // Currently it is not possible to stream requests from browsers
  // there are already first experiments on this field (Chromium)
  // but till it is fully implemented across browsers-land we have to
  // buffer the data before sending the requests.
  if (isNodeReadable(data)) {
    return new Promise(resolve => {
      const buffers: Array<Uint8Array> = []
      data.on('data', d => {
        buffers.push(d)
      })
      data.on('end', () => {
        resolve(new Blob(buffers, { type: 'application/octet-stream' }))
      })
    })
  }

  if (isReadableStream(data)) {
    return new Promise(async resolve => {
      const reader = data.getReader()
      const buffers: Array<Uint8Array> = []

      let done, value
      do {
        ;({ done, value } = await reader.read())

        if (!done) {
          buffers.push(value)
        }
      } while (!done)

      resolve(new Blob(buffers, { type: 'application/octet-stream' }))
    })
  }

  throw new TypeError('unknown data type')
}

export async function prepareWebsocketData(data: string | ArrayBuffer | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  if (data instanceof Blob) return new Uint8Array(await new Response(data as Blob).arrayBuffer())

  throw new TypeError('unknown websocket data type')
}
