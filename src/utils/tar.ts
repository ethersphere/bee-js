import { Collection } from '../types'
import Tar from 'tar-js'
import * as utf8 from 'utf8-encoder'

// this is a workaround type so that we are able to pass in Uint8Arrays
// as string to `tar.append`
interface StringLike {
  readonly length: number
  charCodeAt: (index: number) => number
}

// converts a string to utf8 Uint8Array and returns it as a string-like
// object that `tar.append` accepts as path
function fixUnicodePath(path: string): StringLike {
  const codes = utf8.fromString(path)

  return {
    length: codes.length,
    charCodeAt: index => codes[index],
  }
}

export function makeTar(data: Collection<Uint8Array>): Uint8Array {
  const tar = new Tar()
  for (const entry of data) {
    const path = fixUnicodePath(entry.path)
    tar.append(path, entry.data)
  }

  return tar.out
}
