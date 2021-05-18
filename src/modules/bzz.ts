import {
  Address,
  Collection,
  CollectionUploadOptions,
  Data,
  FileData,
  FileUploadOptions,
  Reference,
  UploadHeaders,
} from '../types'
import { extractUploadHeaders, readFileHeaders } from '../utils/headers'
import { safeAxios } from '../utils/safeAxios'
import { prepareData } from '../utils/data'
import { BeeArgumentError } from '../utils/error'
import { makeTar } from '../utils/tar'
import { assertCollection } from '../utils/collection'
import { AxiosRequestConfig } from 'axios'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { Readable } from 'stream'

const bzzEndpoint = '/bzz'

interface FileUploadHeaders extends UploadHeaders {
  'content-length'?: string
  'content-type'?: string
}

function extractFileUploadHeaders(postageBatchId: Address, options?: FileUploadOptions): FileUploadHeaders {
  const headers: FileUploadHeaders = extractUploadHeaders(postageBatchId, options)

  if (options?.size) headers['content-length'] = String(options.size)

  if (options?.contentType) headers['content-type'] = options.contentType

  return headers
}

/**
 * Upload single file
 *
 * @param url Bee URL
 * @param data Files data
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param name Name that will be attached to the uploaded file. Wraps the data into manifest with set index document.
 * @param options
 */
export async function uploadFile(
  url: string,
  data: string | Uint8Array | Readable | ArrayBuffer,
  postageBatchId: Address,
  name?: string,
  options?: FileUploadOptions,
): Promise<Reference> {
  if (!url) {
    throw new BeeArgumentError('url parameter is required and cannot be empty', url)
  }

  const response = await safeAxios<{ reference: Reference }>({
    ...options?.axiosOptions,
    method: 'post',
    url: url + bzzEndpoint,
    data: prepareData(data),
    headers: {
      ...extractFileUploadHeaders(postageBatchId, options),
    },
    params: { name },
    responseType: 'json',
  })

  return response.data.reference
}

/**
 * Download single file as a buffer
 *
 * @param url  Bee URL
 * @param hash Bee file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 * @param axiosOptions optional - alter default options of axios HTTP client
 */
export async function downloadFile(
  url: string,
  hash: string,
  path = '',
  axiosOptions?: AxiosRequestConfig,
): Promise<FileData<Data>> {
  const response = await safeAxios<ArrayBuffer>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'arraybuffer',
    url: `${url}${bzzEndpoint}/${hash}/${path}`,
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
 * @param url  Bee URL
 * @param hash Bee file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 * @param axiosOptions optional - alter default options of axios HTTP client
 */
export async function downloadFileReadable(
  url: string,
  hash: string,
  path = '',
  axiosOptions?: AxiosRequestConfig,
): Promise<FileData<Readable>> {
  const response = await safeAxios<Readable>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'stream',
    url: `${url}${bzzEndpoint}/${hash}/${path}`,
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
  postageBatchId: Address,
  options?: CollectionUploadOptions,
): CollectionUploadHeaders {
  const headers: CollectionUploadHeaders = extractUploadHeaders(postageBatchId, options)

  if (options?.indexDocument) headers['swarm-index-document'] = options.indexDocument

  if (options?.errorDocument) headers['swarm-error-document'] = options.errorDocument

  return headers
}

/**
 * Upload collection
 * @param url Bee URL
 * @param collection Collection of Uint8Array buffers to upload
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options
 */
export async function uploadCollection(
  url: string,
  collection: Collection<Uint8Array>,
  postageBatchId: Address,
  options?: CollectionUploadOptions,
): Promise<Reference> {
  if (!url) {
    throw new BeeArgumentError('url parameter is required and cannot be empty', url)
  }

  assertCollection(collection)
  const tarData = makeTar(collection)

  const response = await safeAxios<{ reference: Reference }>({
    ...options?.axiosOptions,
    method: 'post',
    url: url + bzzEndpoint,
    data: tarData,
    responseType: 'json',
    headers: {
      'content-type': 'application/x-tar',
      'swarm-collection': 'true',
      ...extractCollectionUploadHeaders(postageBatchId, options),
    },
  })

  return response.data.reference
}
