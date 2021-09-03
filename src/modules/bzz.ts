import {
  BatchId,
  Collection,
  CollectionUploadOptions,
  Data,
  FileData,
  FileUploadOptions,
  Ky,
  Readable,
  Reference,
  UploadHeaders,
  UploadResult,
} from '../types'
import { extractUploadHeaders, readFileHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { prepareData } from '../utils/data'
import { makeTar } from '../utils/tar'
import { assertCollection } from '../utils/collection'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { isReadable } from '../utils/stream'
import { makeTagUid } from '../utils/type'

const bzzEndpoint = 'bzz'

interface FileUploadHeaders extends UploadHeaders {
  'content-length'?: string
  'content-type'?: string
}

function extractFileUploadHeaders(postageBatchId: BatchId, options?: FileUploadOptions): FileUploadHeaders {
  const headers: FileUploadHeaders = extractUploadHeaders(postageBatchId, options)

  if (options?.size) headers['content-length'] = String(options.size)

  if (options?.contentType) headers['content-type'] = options.contentType

  return headers
}

/**
 * Upload single file
 *
 * @param ky
 * @param data Files data
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param name Name that will be attached to the uploaded file. Wraps the data into manifest with set index document.
 * @param options
 */
export async function uploadFile(
  ky: Ky,
  data: string | Uint8Array | Readable | ArrayBuffer,
  postageBatchId: BatchId,
  name?: string,
  options?: FileUploadOptions,
): Promise<UploadResult> {
  if (isReadable(data) && !options?.contentType) {
    if (!options) options = {}

    options.contentType = 'application/octet-stream'
  }

  const response = await http<{ reference: Reference }>(ky, {
    method: 'post',
    path: bzzEndpoint,
    body: await prepareData(data),
    headers: {
      ...extractFileUploadHeaders(postageBatchId, options),
    },
    searchParams: { name },
    responseType: 'json',
  })

  return {
    reference: response.data.reference,
    tagUid: makeTagUid(response.headers.get('swarm-tag')),
  }
}

/**
 * Download single file as a buffer
 *
 * @param ky Ky instance for given Bee class instance
 * @param hash Bee file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 */
export async function downloadFile(ky: Ky, hash: string, path = ''): Promise<FileData<Data>> {
  const response = await http<ArrayBuffer>(ky, {
    method: 'GET',
    responseType: 'arraybuffer',
    path: `${bzzEndpoint}/${hash}/${path}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: wrapBytesWithHelpers(new Uint8Array(response.data)),
  }

  return file
}

/**
 * Download single file as a readable stream
 *
 * @param ky Ky instance for given Bee class instance
 * @param hash Bee file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 */
export async function downloadFileReadable(
  ky: Ky,
  hash: string,
  path = '',
): Promise<FileData<ReadableStream<Uint8Array>>> {
  const response = await http<ReadableStream<Uint8Array>>(ky, {
    method: 'GET',
    responseType: 'stream',
    path: `${bzzEndpoint}/${hash}/${path}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: response.data,
  }

  return file
}

/*******************************************************************************************************************/

// Collections

interface CollectionUploadHeaders extends UploadHeaders {
  'swarm-index-document'?: string
  'swarm-error-document'?: string
}

function extractCollectionUploadHeaders(
  postageBatchId: BatchId,
  options?: CollectionUploadOptions,
): CollectionUploadHeaders {
  const headers: CollectionUploadHeaders = extractUploadHeaders(postageBatchId, options)

  if (options?.indexDocument) headers['swarm-index-document'] = options.indexDocument

  if (options?.errorDocument) headers['swarm-error-document'] = options.errorDocument

  return headers
}

/**
 * Upload collection
 * @param ky Ky instance for given Bee class instance
 * @param collection Collection of Uint8Array buffers to upload
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options
 */
export async function uploadCollection(
  ky: Ky,
  collection: Collection<Uint8Array>,
  postageBatchId: BatchId,
  options?: CollectionUploadOptions,
): Promise<UploadResult> {
  assertCollection(collection)
  const tarData = makeTar(collection)

  const response = await http<{ reference: Reference }>(ky, {
    method: 'post',
    path: bzzEndpoint,
    body: tarData,
    responseType: 'json',
    headers: {
      'content-type': 'application/x-tar',
      'swarm-collection': 'true',
      ...extractCollectionUploadHeaders(postageBatchId, options),
    },
  })

  return {
    reference: response.data.reference,
    tagUid: response.headers.get('swarm-tag') ? makeTagUid(response.headers.get('swarm-tag')) : undefined,
  }
}
