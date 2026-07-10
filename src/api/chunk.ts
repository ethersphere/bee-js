import { Optional } from 'cafe-utility'
import type { BeeRequestOptions, DownloadOptions, EnvelopeWithBatchId, UploadOptions, UploadResult } from '../types'
import { UploadResultBody } from '../types/schema/upload'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'
import { BatchId, Reference } from '../utils/typed-bytes'

const endpoint = 'chunks'

/**
 * Raw HTTP calls for the `/chunks` endpoint.
 */

export async function upload(
  requestOptions: BeeRequestOptions,
  data: Uint8Array,
  stamp: EnvelopeWithBatchId | BatchId | Uint8Array | string,
  options?: UploadOptions,
): Promise<UploadResult> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${endpoint}`,
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...prepareRequestHeaders(stamp, options),
    },
    responseType: 'json',
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

export async function download(
  requestOptions: BeeRequestOptions,
  reference: Reference | string | Uint8Array,
  options?: DownloadOptions,
): Promise<Uint8Array> {
  reference = new Reference(reference)

  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${endpoint}/${reference}`,
    headers: prepareRequestHeaders(null, options),
  })

  return new Uint8Array(response.data)
}
