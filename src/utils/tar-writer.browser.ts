import { Collection } from '../index.js'
import { fileArrayBuffer } from './file.js'
import { TarStream } from './tar.js'

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
