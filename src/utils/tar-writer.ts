import { createReadStream } from 'fs'
import { Collection } from '..'
import { TarStream } from './tar'

export async function writeTar(collection: Collection, tarStream: TarStream) {
  for (const item of collection) {
    tarStream.beginFile(item.path, item.size)

    if (item.fsPath) {
      const stream = createReadStream(item.fsPath)

      for await (const chunk of stream) {
        await tarStream.appendFile(chunk)
      }
      await tarStream.endFile()
      stream.close()
    } else if (item.file) {
      await tarStream.appendFile(new Uint8Array(await item.file.arrayBuffer()))
      await tarStream.endFile()
    } else {
      throw new Error('Invalid collection item')
    }
  }
}
