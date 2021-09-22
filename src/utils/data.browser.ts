import { bufferReadable, isReadable } from './stream'
import { Collection, Readable } from '../types'
import Blob from 'cross-blob'
import { FormData } from 'formdata-node'
import { BeeError } from './error'

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
  if (isReadable(data)) {
    return bufferReadable(data)
  }

  throw new TypeError('unknown data type')
}

export async function prepareWebsocketData(data: string | ArrayBuffer | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  if (data instanceof Blob) return new Uint8Array(await new Response(data as Blob).arrayBuffer())

  throw new TypeError('unknown websocket data type')
}

export async function prepareCollection(data: Collection<Uint8Array | Readable>): Promise<FormData> {
  const form = new FormData()

  for (const el of data) {
    if (el.data instanceof Uint8Array) {
      form.set(el.path, el.data)
    } else if (isReadable(el.data)) {
      if (!el.length) {
        throw new BeeError(`Collection entry '${el.path}' is a stream, but does not have required length!`)
      }

      form.set(el.path, await bufferReadable(el.data))
    }
  }

  return form
}
