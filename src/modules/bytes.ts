import { Optional, Types } from 'cafe-utility'
import type { BeeRequestOptions, DownloadOptions, RedundantUploadOptions, ReferenceInformation } from '../types'
import { UploadResult } from '../types'
import { Bytes } from '../utils/bytes'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { ResourceLocator } from '../utils/resource-locator'
import { makeTagUid, prepareDownloadOptions } from '../utils/type'
import { BatchId, Reference } from '../utils/typed-bytes'

const endpoint = 'bytes'

/**
 * Upload data to a Bee node
 *
 * @param requestOptions Options for making requests
 * @param data            Data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
 */
export async function upload(
  requestOptions: BeeRequestOptions,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  options?: RedundantUploadOptions,
): Promise<UploadResult> {
  const response = await http<unknown>(requestOptions, {
    url: endpoint,
    method: 'post',
    responseType: 'json',
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...prepareRequestHeaders(postageBatchId, options),
    },
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asHexString(body.reference)),
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address']
      ? Optional.of(new Reference(response.headers['swarm-act-history-address']))
      : Optional.empty(),
  }
}

/**
 * Requests content length for a reference
 *
 * @param requestOptions Options for making requests
 * @param hash Bee content reference
 */
export async function head(
  requestOptions: BeeRequestOptions,
  reference: Reference | Uint8Array | string,
): Promise<ReferenceInformation> {
  reference = new Reference(reference)

  const response = await http<void>(requestOptions, {
    url: `${endpoint}/${reference}`,
    method: 'head',
    responseType: 'json',
  })

  return {
    contentLength: parseInt(response.headers['content-length'] as string),
  }
}

/**
 * Download data as a byte array
 *
 * @param requestOptions Options for making requests
 * @param hash Bee content reference
 */
export async function download(
  requestOptions: BeeRequestOptions,
  resource: ResourceLocator,
  options?: DownloadOptions,
): Promise<Bytes> {
  if (options) {
    options = prepareDownloadOptions(options)
  }

  const response = await http<unknown>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${endpoint}/${resource}`,
    headers: prepareRequestHeaders(null, options),
  })

  return new Bytes(response.data as ArrayBuffer)
}

/**
 * Download data as a readable stream
 *
 * @param requestOptions Options for making requests
 * @param hash Bee content reference
 */
export async function downloadReadable(
  requestOptions: BeeRequestOptions,
  resource: ResourceLocator,
  options?: DownloadOptions,
): Promise<ReadableStream<Uint8Array>> {
  if (options) {
    options = prepareDownloadOptions(options)
  }

  const response = await http<ReadableStream<Uint8Array>>(requestOptions, {
    responseType: 'stream',
    url: `${endpoint}/${resource}`,
    headers: prepareRequestHeaders(null, options),
  })

  return response.data
}
