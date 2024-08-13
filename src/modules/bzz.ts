import { Readable } from 'stream'
import {
  BatchId,
  BeeRequestOptions,
  Collection,
  CollectionUploadOptions,
  Data,
  DownloadRedundancyOptions,
  FileData,
  FileUploadOptions,
  GetGranteesResult,
  GranteesResult,
  Reference,
  ReferenceOrEns,
  UploadHeaders,
  UploadRedundancyOptions,
  UploadResult,
} from '../types'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { assertCollection } from '../utils/collection'
import { extractDownloadHeaders, extractRedundantUploadHeaders, readFileHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { uploadTar } from '../utils/tar-uploader'
import { isReadable, makeTagUid } from '../utils/type'

const bzzEndpoint = 'bzz'
const granteeEndpoint = 'grantee'

export async function getGrantees(reference: string, requestOptions: BeeRequestOptions): Promise<GetGranteesResult> {
  const response = await http<GetGranteesResult>(requestOptions, {
    method: 'get',
    url: `${granteeEndpoint}/${reference}`,
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data.data,
  }
}

export async function createGrantees(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  grantees: string[],
): Promise<GranteesResult> {
  const response = await http<GranteesResult>(requestOptions, {
    method: 'post',
    url: granteeEndpoint,
    data: { grantees: grantees },
    headers: {
      ...extractRedundantUploadHeaders(postageBatchId),
    },
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    ref: response.data.ref,
    historyref: response.data.historyref,
  }
}

export async function patchGrantees(
  reference: string,
  historyRef: string,
  postageBatchId: BatchId,
  grantees: string,
  requestOptions: BeeRequestOptions,
): Promise<GranteesResult> {
  const response = await http<GranteesResult>(requestOptions, {
    method: 'patch',
    url: `${granteeEndpoint}/${reference}`,
    data: grantees,
    headers: {
      ...extractRedundantUploadHeaders(postageBatchId),
      'swarm-act-history-address': historyRef,
    },
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    ref: response.data.ref,
    historyref: response.data.historyref,
  }
}

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

  const response = await http<{ reference: Reference }>(requestOptions, {
    method: 'post',
    url: bzzEndpoint,
    data,
    headers: {
      ...extractFileUploadHeaders(postageBatchId, options),
    },
    params: { name },
    responseType: 'json',
  })

  return {
    reference: response.data.reference,
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    history_address: response.headers['swarm-act-history-address'] || '',
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
  hash: ReferenceOrEns,
  path = '',
  options?: DownloadRedundancyOptions,
): Promise<FileData<Data>> {
  const response = await http<ArrayBuffer>(requestOptions, {
    method: 'GET',
    responseType: 'arraybuffer',
    url: `${bzzEndpoint}/${hash}/${path}`,
    headers: extractDownloadHeaders(options),
  })
  const file = {
    ...readFileHeaders(response.headers as Record<string, string>),
    data: wrapBytesWithHelpers(new Uint8Array(response.data)),
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
  hash: ReferenceOrEns,
  path = '',
  options?: DownloadRedundancyOptions,
): Promise<FileData<ReadableStream<Uint8Array>>> {
  const response = await http<ReadableStream<Uint8Array>>(requestOptions, {
    method: 'GET',
    responseType: 'stream',
    url: `${bzzEndpoint}/${hash}/${path}`,
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

  return {
    reference: response.data.reference,
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    history_address: response.headers['swarm-act-history-address'] || '',
  }
}
