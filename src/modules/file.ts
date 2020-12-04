import { Readable } from 'stream'
import { OptionsUpload, Dictionary } from '../types'
import { prepareData } from '../utils/data'
import { safeAxios } from '../utils/safeAxios'
import contentDisposition from 'content-disposition'
import { BeeError } from '../utils/error'

const endpoint = '/files'

interface FileHeaders {
  name: string
  tagUid?: number
}

export interface File<T> extends FileHeaders {
  data: T
}

function extractHeaders(options?: OptionsUpload): Dictionary<boolean | number | string> {
  const headers: Dictionary<boolean | number | string> = {}

  if (options?.pin) headers['swarm-pin'] = options.pin

  if (options?.encrypt) headers['swarm-encrypt'] = options.encrypt

  if (options?.tag) headers['swarm-tag-uid'] = options.tag

  if (options?.size) headers['content-length'] = options.size

  return headers
}

function readContentDispositionFilename(header?: string): string {
  try {
    if (header == null) {
      throw new BeeError('missing content-disposition header')
    }
    const disposition = contentDisposition.parse(header)

    if (disposition?.parameters?.filename) {
      return disposition.parameters.filename
    }
    throw new BeeError('invalid content-disposition header')
  } catch (e) {
    throw new BeeError(e.message)
  }
}

function readTagUid(header?: string): number | undefined {
  if (header == null) {
    return undefined
  }

  return parseInt(header, 10)
}

function readFileHeaders(headers: Dictionary<string>): FileHeaders {
  const name = readContentDispositionFilename(headers['content-disposition'])
  const tagUid = readTagUid(headers['swarm-tag-uid'])

  return {
    name,
    tagUid
  }
}

/**
 * Upload single file to a Bee node
 *
 * @param url     Bee file URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export async function upload(
  url: string,
  name: string,
  data: string | Uint8Array | Readable,
  options?: OptionsUpload
): Promise<string> {
  const response = await safeAxios<{ reference: string }>({
    method: 'post',
    url: url + endpoint,
    data: await prepareData(data),
    headers: {
      'content-type': 'application/octet-stream',
      ...extractHeaders(options)
    },
    responseType: 'json',
    params: { name }
  })

  return response.data.reference
}

/**
 * Download single file as a buffer
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export async function download(url: string, hash: string): Promise<File<Uint8Array>> {
  const response = await safeAxios<ArrayBuffer>({
    responseType: 'arraybuffer',
    url: `${url}${endpoint}/${hash}`
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: new Uint8Array(response.data)
  }

  return file
}

/**
 * Download single file as a readable stream
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export async function downloadReadable(url: string, hash: string): Promise<File<Readable>> {
  const response = await safeAxios<Readable>({
    responseType: 'stream',
    url: `${url}${endpoint}/${hash}`
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: response.data
  }

  return file
}
