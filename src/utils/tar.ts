import { pack } from 'tar-stream'
import { Collection } from '../types'
import { PassThrough } from 'stream'

export function makeTar(data: Collection<Uint8Array>): PassThrough {
  const tar = pack()

  for (const entry of data) {
    tar.entry(
      {
        name: entry.path,
      },
      Buffer.from(entry.data),
    )
  }

  tar.finalize()

  const stream = new PassThrough()

  tar.pipe(stream)

  return stream
}
