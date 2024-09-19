import { Collection } from '..'
import { fileArrayBuffer } from './file'
import { TarStream } from './tar'

export async function writeTar(collection: Collection, tarStream: TarStream) {
  for (const item of collection) {
    if (item.file) {
      tarStream.beginFile(item.path, item.file.size)
      await tarStream.appendFile(new Uint8Array(await fileArrayBuffer(item.file)))
      await tarStream.endFile()
    } else {
      throw new Error('Invalid collection item')
    }
  }
}
