import { Readable } from 'stream'

export function prepareData (
  data: string | Buffer | Readable
): Buffer | Readable {
  if (typeof data === 'string') {
    return Buffer.from(data)
  }
  return data
}
