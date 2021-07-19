import { Collection } from '../types'
import { Readable } from 'stream'
import * as tar from 'tar-stream'
import { Pack } from 'tar-stream'
import { assertNonNegativeInteger, isReadable } from './type'

type FileInfo = { name: string; size: number; stream: Readable }

/**
 * Helper class for tar-stream as found at https://github.com/mafintosh/tar-stream/issues/24#issuecomment-579797456
 * Modified for better readability.
 *
 * Credit to https://github.com/dominicbartl
 */
export class TarArchive {
  private pack = tar.pack()
  private streamQueue: FileInfo[] = []
  private size = 0

  addBuffer(name: string, buffer: Buffer) {
    this.size += buffer.length
    this.pack.entry(
      {
        name: name,
      },
      buffer,
    )
  }

  addStream(name: string, size: number, stream: Readable) {
    this.streamQueue.push({
      name,
      size,
      stream,
    })
  }

  async write(): Promise<Pack> {
    return new Promise((resolve, reject) => {
      this.nextEntry(err => {
        if (err) {
          reject(err)
        } else {
          resolve(this.pack)
        }
      })
    })
  }

  private nextEntry(callback: (err?: Error) => void) {
    const file = this.streamQueue.shift()

    if (file) {
      const writeEntryStream = this.pack.entry(
        {
          name: file.name,
          size: file.size,
        },
        err => {
          if (err) {
            callback(err)
          } else {
            this.size += file.size
            this.nextEntry(callback)
          }
        },
      )
      file.stream.pipe(writeEntryStream)
    } else {
      this.pack.finalize()
      callback()
    }
  }
}

export async function makeTar(data: Collection<Uint8Array | Readable>): Promise<Readable> {
  const tar = new TarArchive()

  for (const entry of data) {
    if (isReadable(entry.data)) {
      assertNonNegativeInteger(entry.length, 'entry.length')

      tar.addStream(entry.path, entry.length, entry.data)
    } else if (entry.data instanceof Uint8Array) {
      tar.addBuffer(entry.path, Buffer.from(entry.data))
    } else {
      throw new TypeError('Unknown data type!')
    }
  }

  return tar.write()
}
