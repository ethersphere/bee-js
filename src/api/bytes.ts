import { Optional } from 'cafe-utility'
import type { BeeRequestOptions, DownloadOptions, RedundantUploadOptions, ReferenceInformation } from '../types'
import { UploadResult } from '../types'
import { UploadResultBody } from '../types/schema/upload'
import { Bytes } from '../utils/bytes'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { ResourceLocator } from '../utils/resource-locator'
import { DownloadOptionsSchema } from '../utils/schema'
import { makeTagUid } from '../utils/type'
import { BatchId, Reference } from '../utils/typed-bytes'

const endpoint = 'bytes'

/**
 * Raw HTTP calls for the `/bytes` endpoint.
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

  const body = UploadResultBody.parse(response.data)

  return {
    reference: body.reference,
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address']
      ? Optional.of(new Reference(response.headers['swarm-act-history-address']))
      : Optional.empty(),
  }
}

export async function head(requestOptions: BeeRequestOptions, reference: Reference): Promise<ReferenceInformation> {
  const response = await http<void>(requestOptions, {
    url: `${endpoint}/${reference}`,
    method: 'head',
    responseType: 'json',
  })

  return {
    contentLength: parseInt(response.headers['content-length'] as string),
  }
}

export async function download(
  requestOptions: BeeRequestOptions,
  resource: ResourceLocator,
  options?: DownloadOptions,
): Promise<Bytes> {
  if (options) {
    options = DownloadOptionsSchema.parse(options)
  }

  const response = await http<unknown>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${endpoint}/${resource}`,
    headers: prepareRequestHeaders(null, options),
  })

  return new Bytes(response.data as ArrayBuffer)
}

export async function downloadReadable(
  requestOptions: BeeRequestOptions,
  resource: ResourceLocator,
  options?: DownloadOptions,
): Promise<ReadableStream<Uint8Array>> {
  if (options) {
    options = DownloadOptionsSchema.parse(options)
  }

  const response = await http<ReadableStream<Uint8Array>>(requestOptions, {
    responseType: 'stream',
    url: `${endpoint}/${resource}`,
    headers: prepareRequestHeaders(null, options),
  })

  return response.data
}
