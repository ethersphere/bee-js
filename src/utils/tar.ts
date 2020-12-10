import type { Readable, Writable } from 'stream'
import * as tar from 'tar-stream'
import type { Pack } from 'tar-stream'

type FileInfo = {
  name: string
  size: number
  stream: Readable
}

/**
 * Credit to https://github.com/dominicbartl
 * Took from: https://github.com/mafintosh/tar-stream/issues/24#issuecomment-579797456
 */
export class TarArchive {
  private pack = tar.pack()
  private streamQueue: FileInfo[] = []

  addUint8Array(name: string, buffer: Uint8Array): TarArchive {
    this.pack.entry({ name }, Buffer.from(buffer))

    return this
  }

  addStream(name: string, size: number, stream: Readable): TarArchive {
    this.streamQueue.push({
      name,
      size,
      stream,
    })

    return this
  }

  write(streamCallback: (pack: Pack) => Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      this.nextEntry(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })

      streamCallback(this.pack).on('error', err => {
        this.pack.destroy(err)
        reject(err)
      })
    })
  }

  private nextEntry(callback: (err?: Error) => void): void {
    const file = this.streamQueue.shift()

    if (!file) {
      this.pack.finalize()
      callback()

      return
    }

    const writeEntryStream = this.pack.entry(
      {
        name: file.name,
        size: file.size,
      },
      err => {
        if (err) {
          callback(err)
        } else {
          this.nextEntry(callback)
        }
      },
    )
    file.stream.pipe(writeEntryStream)
  }
}
