import { Readable } from 'stream'

// eslint-disable-next-line require-await
export async function prepareData (
  data: string | Uint8Array | Readable
): Promise<Uint8Array> {
  // string
  if (typeof data === 'string') return Buffer.from(data)

  // buffer
  if (data instanceof Uint8Array) return data

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
