import {
  BatchId,
  BeeRequestOptions,
  Data,
  DownloadRedundancyOptions,
  ReferenceResponse,
  UploadOptions,
  UploadResult,
} from '../types'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { extractDownloadHeaders, extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'

const socEndpoint = 'soc'

/**
 * Upload single owner chunk (SOC) to a Bee node
 *
 * @param requestOptions  Options for making requests
 * @param owner           Owner's ethereum address in hex
 * @param identifier      Arbitrary identifier in hex
 * @param signature       Signature in hex
 * @param data            Content addressed chunk data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
 */
export async function upload(
  requestOptions: BeeRequestOptions,
  owner: string,
  identifier: string,
  signature: string,
  data: Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<UploadResult> {
  const response = await http<ReferenceResponse>(requestOptions, {
    method: 'post',
    url: `${socEndpoint}/${owner}/${identifier}`,
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
    responseType: 'json',
    params: { sig: signature },
  })

  return {
    reference: response.data.reference,
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address'] || '',
  }
}

/**
 * Download data as a byte array
 *
 * @param requestOptions Options for making requests
 *
 */
export async function download(
  requestOptions: BeeRequestOptions,
  owner: string,
  identifier: string,
  options?: DownloadRedundancyOptions,
): Promise<Data> {
  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${socEndpoint}/${owner}/${identifier}`,
    headers: extractDownloadHeaders(options),
  })

  return wrapBytesWithHelpers(new Uint8Array(response.data))
}
