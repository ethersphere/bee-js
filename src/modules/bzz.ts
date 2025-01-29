import { Types } from 'cafe-utility'
import { Readable } from 'stream'
import {
  BeeRequestOptions,
  Collection,
  CollectionUploadOptions,
  DownloadRedundancyOptions,
  FileData,
  FileUploadOptions,
  UploadHeaders,
  UploadRedundancyOptions,
  UploadResult,
} from '../types'
import { Bytes } from '../utils/bytes'
import { assertCollection } from '../utils/collection'
import { extractDownloadHeaders, extractRedundantUploadHeaders, readFileHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { uploadTar } from '../utils/tar-uploader'
import { isReadable, makeTagUid } from '../utils/type'
import { BatchId, Reference } from '../utils/typed-bytes'

const bzzEndpoint = 'bzz'

interface FileUploadHeaders extends UploadHeaders {
  'content-length'?: string
  'content-type'?: string
}

function extractFileUploadHeaders(
  postageBatchId: BatchId,
  options?: FileUploadOptions & UploadRedundancyOptions,
): FileUploadHeaders {
  const headers: FileUploadHeaders = extractRedundantUploadHeaders(postageBatchId, options)

  if (options?.size) headers['content-length'] = String(options.size)

  if (options?.contentType) headers['content-type'] = options.contentType

  return headers
}

/**
 * Upload single file
 *
 * @param requestOptions Options for making requests
 * @param data Files data
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param name Name that will be attached to the uploaded file. Wraps the data into manifest with set index document.
 * @param options
 */
export async function uploadFile(
  requestOptions: BeeRequestOptions,
  data: string | Uint8Array | Readable | ArrayBuffer,
  postageBatchId: BatchId,
  name?: string,
  options?: FileUploadOptions & UploadRedundancyOptions,
): Promise<UploadResult> {
  if (isReadable(data) && !options?.contentType) {
    if (!options) {
      options = {}
    }
    options.contentType = 'application/octet-stream'
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: bzzEndpoint,
    data,
    headers: {
      ...extractFileUploadHeaders(postageBatchId, options),
    },
    params: { name },
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asHexString(body.reference)),
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address'] || '',
  }
}

/**
 * Download single file as a buffer
 *
 * @param requestOptions Options for making requests
 * @param hash Bee file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 */
export async function downloadFile(
  requestOptions: BeeRequestOptions,
  reference: Reference | string | Uint8Array,
  path = '',
  options?: DownloadRedundancyOptions,
): Promise<FileData<Bytes>> {
  reference = new Reference(reference)

  const response = await http<ArrayBuffer>(requestOptions, {
    method: 'GET',
    responseType: 'arraybuffer',
    url: `${bzzEndpoint}/${reference}/${path}`,
    headers: extractDownloadHeaders(options),
  })
  const file = {
    ...readFileHeaders(response.headers as Record<string, string>),
    data: new Bytes(response.data),
  }

  return file
}

/**
 * Download single file as a readable stream
 *
 * @param requestOptions Options for making requests
 * @param hash Bee file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 */
export async function downloadFileReadable(
  requestOptions: BeeRequestOptions,
  reference: Reference,
  path = '',
  options?: DownloadRedundancyOptions,
): Promise<FileData<ReadableStream<Uint8Array>>> {
  reference = new Reference(reference)

  const response = await http<ReadableStream<Uint8Array>>(requestOptions, {
    method: 'GET',
    responseType: 'stream',
    url: `${bzzEndpoint}/${reference}/${path}`,
    headers: extractDownloadHeaders(options),
  })
  const file = {
    ...readFileHeaders(response.headers as Record<string, string>),
    data: response.data,
  }

  return file
}

/*******************************************************************************************************************/

// Collections

export interface CollectionUploadHeaders extends UploadHeaders {
  'swarm-index-document'?: string
  'swarm-error-document'?: string
}

export function extractCollectionUploadHeaders(
  postageBatchId: BatchId,
  options?: CollectionUploadOptions & UploadRedundancyOptions,
): CollectionUploadHeaders & UploadRedundancyOptions {
  const headers: CollectionUploadHeaders = extractRedundantUploadHeaders(postageBatchId, options)

  if (options?.indexDocument) {
    headers['swarm-index-document'] = options.indexDocument
  }

  if (options?.errorDocument) {
    headers['swarm-error-document'] = options.errorDocument
  }

  return headers
}

/**
 * Upload collection
 * @param requestOptions Options for making requests
 * @param collection Collection of Uint8Array buffers to upload
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options
 */
export async function uploadCollection(
  requestOptions: BeeRequestOptions,
  collection: Collection,
  postageBatchId: BatchId,
  options?: CollectionUploadOptions & UploadRedundancyOptions,
): Promise<UploadResult> {
  assertCollection(collection)
  const response = await uploadTar(requestOptions, collection, postageBatchId, options)

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asHexString(body.reference)),
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address'] || '',
  }
}
