import { Types } from 'cafe-utility'
import type {
  BeeRequestOptions,
  DownloadRedundancyOptions,
  ReferenceInformation,
  UploadOptions,
  UploadRedundancyOptions,
} from '../types'
import { UploadResult } from '../types'
import { Bytes } from '../utils/bytes'
import { extractDownloadHeaders, extractRedundantUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'
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
  options?: UploadOptions & UploadRedundancyOptions,
): Promise<UploadResult> {
  const response = await http<unknown>(requestOptions, {
    url: endpoint,
    method: 'post',
    responseType: 'json',
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractRedundantUploadHeaders(postageBatchId, options),
    },
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asHexString(body.reference)),
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address'] || '',
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
  reference: Reference | Uint8Array | string,
  options?: DownloadRedundancyOptions,
): Promise<Bytes> {
  reference = new Reference(reference)

  const response = await http<unknown>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${endpoint}/${reference}`,
    headers: extractDownloadHeaders(options),
  })

  // TODO this is a lie
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
  reference: Reference | Uint8Array | string,
  options?: DownloadRedundancyOptions,
): Promise<ReadableStream<Uint8Array>> {
  reference = new Reference(reference)

  const response = await http<ReadableStream<Uint8Array>>(requestOptions, {
    responseType: 'stream',
    url: `${endpoint}/${reference}`,
    headers: extractDownloadHeaders(options),
  })

  return response.data
}
