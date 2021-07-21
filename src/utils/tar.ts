import { Collection, Readable } from '../types'
import * as tar from 'tar-stream'
import { Pack } from 'tar-stream'
import { assertNonNegativeInteger, isReadable } from './type'
import type { Readable as NodeReadable } from 'stream'
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream'

type FileInfo = { name: string; size: number; stream: NodeReadable }

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

  addBuffer(name: string, buffer: Buffer): void {
    this.size += buffer.length
    this.pack.entry(
      {
        name: name,
      },
      buffer,
    )
  }

  addStream(name: string, size: number, stream: Readable): void {
    this.streamQueue.push({
      name,
      size,
      stream: this.normalizeStream(stream),
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

  private normalizeStream(stream: Readable): NodeReadable {
    const browserReadable = stream as ReadableStream

    if (
      typeof browserReadable.getReader === 'function' &&
      browserReadable.locked !== undefined &&
      typeof browserReadable.cancel === 'function' &&
      typeof browserReadable.pipeTo === 'function' &&
      typeof browserReadable.pipeThrough === 'function'
    ) {
      // The typings for `readable-stream` is implementing old version of streams
      // so I am re-typing this to use the native typings from `stream` package.
      return new ReadableWebToNodeStream(stream as ReadableStream) as unknown as NodeReadable
    }

    return stream as NodeReadable
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
      assertNonNegativeInteger(entry.length, "Collection's entry.length")

      tar.addStream(entry.path, entry.length, entry.data)
    } else if (entry.data instanceof Uint8Array) {
      tar.addBuffer(entry.path, Buffer.from(entry.data))
    } else {
      throw new TypeError('Unknown data type!')
    }
  }

  return tar.write()
}
