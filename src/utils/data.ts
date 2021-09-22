import type { Data } from 'ws'
import Blob from 'cross-blob'
import FormData from 'form-data'
import { Buffer } from 'buffer'

import { isNodeReadable, isReadableStream, readableWebToNode } from './stream'
import { Collection, Readable } from '../types'
import { isUint8Array } from './type'

export async function prepareData(
  data: string | ArrayBuffer | Uint8Array | Readable,
): Promise<Blob | ReadableStream<Uint8Array> | never> {
  if (typeof data === 'string') return new Blob([data], { type: 'text/plain' })

  if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    return new Blob([data], { type: 'application/octet-stream' })
  }

  if (data instanceof Blob || isNodeReadable(data)) return data as ReadableStream<Uint8Array>

  if (isReadableStream(data)) {
    return readableWebToNode(data) as unknown as ReadableStream<Uint8Array>
  }

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

export async function prepareCollection(data: Collection<Uint8Array | Readable>): Promise<FormData> {
  const form = new FormData()

  for (const el of data) {
    let resolvedData, length

    if (isReadableStream(el.data)) {
      length = el.length
      resolvedData = readableWebToNode(el.data)
    } else if (isUint8Array(el.data)) {
      resolvedData = Buffer.from(el.data)
      length = resolvedData.length
    } else {
      resolvedData = el.data
      length = el.length
    }

    form.append(el.path, resolvedData, {
      filepath: el.path,
      knownLength: length,
      header: {
        'Content-Length': length,
      },
    })
  }

  return form
}
