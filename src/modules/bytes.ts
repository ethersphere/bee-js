import type { BatchId, Data, Reference, ReferenceOrEns, UploadOptions } from '../types'
import { prepareData } from '../utils/data'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { UploadResult } from '../types'
import { makeTagUid } from '../utils/type'
import type { Options as KyOptions } from 'ky'

const endpoint = 'bytes'

/**
 * Upload data to a Bee node
 *
 * @param kyOptions Ky Options for making requests
 * @param data            Data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
 */
export async function upload(
  kyOptions: KyOptions,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<UploadResult> {
  const response = await http<{ reference: Reference }>(kyOptions, {
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
    reference: response.parsedData.reference,
    tagUid: makeTagUid(response.headers.get('swarm-tag')),
  }
}

/**
 * Download data as a byte array
 *
 * @param ky
 * @param hash Bee content reference
 */
export async function download(kyOptions: KyOptions, hash: ReferenceOrEns): Promise<Data> {
  const response = await http<ArrayBuffer>(kyOptions, {
    responseType: 'arraybuffer',
    path: `${endpoint}/${hash}`,
  })

  return wrapBytesWithHelpers(new Uint8Array(response.parsedData))
}

/**
 * Download data as a readable stream
 *
 * @param ky
 * @param hash Bee content reference
 */
export async function downloadReadable(
  kyOptions: KyOptions,
  hash: ReferenceOrEns,
): Promise<ReadableStream<Uint8Array>> {
  const response = await http<ReadableStream<Uint8Array>>(kyOptions, {
    responseType: 'stream',
    path: `${endpoint}/${hash}`,
  })

  return response.parsedData
}
