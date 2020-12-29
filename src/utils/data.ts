import type { Readable } from 'stream'

// eslint-disable-next-line require-await
export async function prepareData(data: string | Uint8Array | Readable): Promise<Uint8Array | Readable> {
  if (typeof data === 'string') {
    return Buffer.from(data)
  }

  return data
}
