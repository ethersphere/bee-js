import { Readable } from 'readable-stream'

// eslint-disable-next-line require-await
export async function prepareData(data: string | Buffer | Readable): Promise<Buffer | Readable> {
  if (typeof data === 'string') {
    return Buffer.from(data)
  }

  return data
}
