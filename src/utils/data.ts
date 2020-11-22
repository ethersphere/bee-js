import { Readable } from 'stream'

export async function prepareData(data: string | Buffer | Readable): Promise<Buffer> {
  // string
  if (typeof data === 'string') return Buffer.from(data)

  // buffer
  if (Buffer.isBuffer(data)) return data

  // readable
  const readableData: Buffer = await new Promise<Buffer>(resolve => {
    const buffers: Array<Uint8Array> = []
    data.on('data', d => {
      buffers.push(d)
    })
    data.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
  })

  return readableData
}
