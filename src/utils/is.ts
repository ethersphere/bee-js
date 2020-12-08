import { Readable } from 'stream'

export function isReadable(entry: unknown): entry is Readable {
  return typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as Readable).pipe === 'function' &&
    (entry as Readable).readable !== false &&
    typeof (entry as Readable)._read === 'function'
}
