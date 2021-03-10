/**
 * Validates input and converts to Uint8Array
 *
 * @param data any string, ArrayBuffer or Uint8Array
 */
export function prepareData(data: string | ArrayBuffer | Uint8Array): Uint8Array | never {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  if (data instanceof Uint8Array) return data

  throw new TypeError('unknown data type')
}

export async function prepareWebsocketData(data: string | ArrayBuffer | Blob): Promise<Uint8Array> | never {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  if (data instanceof Blob) return new Uint8Array(await new Response(data as Blob).arrayBuffer())

  throw new TypeError('unknown websocket data type')
}
