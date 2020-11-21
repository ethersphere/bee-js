import { Readable } from 'stream'
import request from 'superagent'

import type { OptionsUpload, CollectionContainer } from '../types'
import { extractHeaders, isCollection, isReadable, isReadableOrBuffer, returnReference } from '../utils'
import { TarArchive } from '../utils/tar'

function packData<T> (data: CollectionContainer<T>): TarArchive {
  const tar = new TarArchive()

  for (const entry of data) {
    if (Buffer.isBuffer(entry.data)) {
      tar.addBuffer(entry.path, entry.data)
    } else if (isReadable(entry.data)) {
      if (!entry.size) {
        throw new Error(`Size has to be specified for Readable data! [${entry.path}]`)
      }

      tar.addStream(entry.path, entry.size, entry.data)
    }
  }

  return tar
}

/**
 * Upload collection of files to a Bee node
 *
 * @param url     Bee URL
 * @param data    Data in Collection format to be uploaded
 * @param options Additional options like tag, encryption, pinning
 */
export async function upload (
  url: string,
  data: CollectionContainer<Buffer | Readable>,
  options?: OptionsUpload
): Promise<string> {
  if (!url || !data) {
    throw new Error('url and data parameters are required!')
  }

  if (!isCollection<Buffer | Readable>(data, isReadableOrBuffer)) {
    throw new Error('Passed data are not in Collection format!')
  }

  const tar = packData(data)
  const req = request.post(`${url}/dirs`)
    .type('application/x-tar')
    .set(extractHeaders(options))

  const referencePromise = returnReference(req)

  // superagent typing issue for streams
  // @ts-ignore
  await tar.write(pack => pack.pipe(req))

  return referencePromise
}

/**
 * Download single file as a buffer from Collection given using the path
 *
 * @param url  Bee URL
 * @param hash Bee Collection hash
 * @param path Path of the requested file in the Collection
 */
export async function download (url: string, hash: string, path: string): Promise<Buffer> {
  return Buffer.from(
    (await request.get(`${url}/bzz/${hash}/${path}`).responseType('arraybuffer')).body
  )
}

/**
 * Download single file as a buffer from Collection given using the path
 *
 * @param url  Bee URL
 * @param hash Bee Collection hash
 * @param path Path of the requested file in the Collection
 */
export function downloadReadable (
  url: string,
  hash: string,
  path: string
): Promise<Readable> {
  // It seems that superagent only implements "pipable" interface and that is the reason why TS complains.
  // Have to investigate more.
  // @ts-ignore
  return request.get(`${url}/bzz/${hash}/${path}`)
}
