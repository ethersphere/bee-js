import { Readable } from 'stream'

// eslint-disable-next-line require-await
export async function prepareData (
  data: string | Buffer | Readable
): Promise<Buffer> {
  // string
  if (typeof data === 'string') return Buffer.from(data)

  // buffer
  if (Buffer.isBuffer(data)) return data

  // readable
  return new Promise(resolve => {
    const buffers: Array<Uint8Array> = []
    data.on('data', function (d) {
      buffers.push(d)
    })
    data.on('end', function () {
      resolve(Buffer.concat(buffers))
    })
  })
}
