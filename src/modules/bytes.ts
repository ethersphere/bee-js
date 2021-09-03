import type { BatchId, Data, Ky, Reference, UploadOptions } from '../types'
import { prepareData } from '../utils/data'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { UploadResult } from '../types'
import { makeTagUid } from '../utils/type'

const endpoint = 'bytes'

/**
 * Upload data to a Bee node
 *
 * @param ky              Ky instance
 * @param data            Data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
 */
export async function upload(
  ky: Ky,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<UploadResult> {
  const response = await http<{ reference: Reference }>(ky, {
    path: endpoint,
    method: 'post',
    responseType: 'json',
    body: await prepareData(data),
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
  })

  return {
    reference: response.data.reference,
    tagUid: makeTagUid(response.headers.get('swarm-tag')),
  }
}

/**
 * Download data as a byte array
 *
 * @param ky
 * @param hash Bee content reference
 */
export async function download(ky: Ky, hash: Reference): Promise<Data> {
  const response = await http<ArrayBuffer>(ky, {
    responseType: 'arraybuffer',
    path: `${endpoint}/${hash}`,
  })

  return wrapBytesWithHelpers(new Uint8Array(response.data))
}

/**
 * Download data as a readable stream
 *
 * @param ky
 * @param hash Bee content reference
 */
export async function downloadReadable(ky: Ky, hash: Reference): Promise<ReadableStream<Uint8Array>> {
  const response = await http<ReadableStream<Uint8Array>>(ky, {
    responseType: 'stream',
    path: `${endpoint}/${hash}`,
  })

  return response.data
}
