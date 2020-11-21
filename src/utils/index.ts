import { CollectionContainer, Dictionary, OptionsUpload } from '../types'
import { Request } from 'superagent'
import { Readable } from 'stream'

export function extractHeaders (options?: OptionsUpload): Dictionary<string | boolean | number> {
  const headers: Dictionary<string | boolean | number> = {}

  if (options?.pin) headers['swarm-pin'] = options.pin

  if (options?.encrypt) headers['swarm-encrypt'] = options.encrypt

  if (options?.tag) headers['swarm-tag-uid'] = options.tag

  if (options?.index) headers['swarm-index'] = options.index

  if (options?.size) headers['content-length'] = options.size
  return headers
}

export function returnReference (req: Request): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    req.on('response', response => {
      if (response.error) {
        return reject(response.error)
      }

      if (!response.body.reference) {
        return reject(new Error('Response did not contain Reference!'))
      }

      resolve(response.body.reference)
    })
  })
}

export function isReadable (entry: unknown): entry is Readable {
  return typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as Readable).pipe === 'function' &&
    (entry as Readable).readable !== false &&
    typeof (entry as Readable)._read === 'function'
}

export function isCollection<T> (data: object, genericTest: (entry: T) => boolean): data is CollectionContainer<T> {
  if (!Array.isArray(data)) {
    return false
  }

  return !data.some(
    entry => typeof entry !== 'object' ||
      !entry.data ||
      !entry.path ||
      !genericTest(entry.data)
  )
}

export function isReadableOrBuffer (entry: unknown): entry is Readable | Buffer {
  return Buffer.isBuffer(entry) || isReadable(entry)
}
