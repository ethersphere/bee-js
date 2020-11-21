import { Readable } from 'stream'
import request from 'superagent'

import type { OptionsUpload } from '../types'
import { extractHeaders, isReadable, returnReference } from '../utils'
import { prepareData } from '../utils/data'


/**
 * Upload single file to a Bee node
 *
 * @param url     Bee file URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export async function upload (
  url: string,
  data: string | Buffer | Readable,
  options?: OptionsUpload
): Promise<string> {
  if (!url || !data) {
    throw new Error('url and data parameters are required!')
  }

  const req = request.post(url)
    .type('application/octet-stream')
    .set(extractHeaders(options))

  if (isReadable(data)) {
    // According superagent documentation this should be supported
    // will have to investigate the types later on.
    // @ts-ignore
    data.pipe(req)
  } else if (Buffer.isBuffer(data) || typeof data === 'string') {
    req.send(prepareData(data))
    req.end()
  } else {
    throw new TypeError('Unknown type of input data!')
  }

  return returnReference(req)
}

/**
 * Download single file as a buffer
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export async function download (url: string, hash: string): Promise<Buffer> {
  if (!url || !hash) {
    throw new Error('url and hash parameters are required!')
  }

  return Buffer.from(
    (await request.get(`${url}/${hash}`).responseType('arraybuffer')).body
  )
}

/**
 * Download single file as a readable stream
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export async function downloadReadable (
  url: string,
  hash: string
): Promise<Readable> {
  if (!url || !hash) {
    throw new Error('url and hash parameters are required!')
  }

  // It seems that superagent only implements "pipable" interface and that is the reason why TS complains.
  // Have to investiage more.
  // @ts-ignore
  return request.get(`${url}/${hash}`)
}
