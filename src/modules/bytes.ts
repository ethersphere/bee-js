import type { AxiosRequestConfig } from 'axios'
import type { Readable } from 'stream'
import { BatchId, Data, Ky, Reference, UploadOptions } from '../types'
import { prepareData } from '../utils/data'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { wrapBytesWithHelpers } from '../utils/bytes'

const endpoint = '/bytes'

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
): Promise<Reference> {
  const response = await http(ky, {
    url: endpoint,
    method: 'post',
    body: await prepareData(data),
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
  })

  const responseData = await response.json<{ reference: Reference }>()

  return responseData.reference
}

/**
 * Download data as a byte array
 *
 * @param url  Bee URL
 * @param hash Bee content reference
 */
export async function download(ky: Ky, hash: Reference): Promise<Data> {
  const response = await http<ArrayBuffer>({
    responseType: 'arraybuffer',
    url: `${url}${endpoint}/${hash}`,
  })

  return wrapBytesWithHelpers(new Uint8Array(response.data))
}

/**
 * Download data as a readable stream
 *
 * @param url  Bee URL
 * @param hash Bee content reference
 * @param axiosOptions optional - alter default options of axios HTTP client
 */
export async function downloadReadable(ky: Ky, hash: Reference, axiosOptions?: AxiosRequestConfig): Promise<Readable> {
  const response = await http<Readable>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'stream',
    url: `${url}${endpoint}/${hash}`,
  })

  return response.data
}
