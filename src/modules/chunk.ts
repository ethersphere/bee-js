import type { AxiosRequestConfig } from 'axios'
import type { Readable } from 'stream'
import type { BatchId, ReferenceResponse, UploadOptions } from '../types'
import { extractUploadHeaders } from '../utils/headers'
import { safeAxios } from '../utils/safe-axios'
import { Reference } from '../types'

const endpoint = '/chunks'

/**
 * Upload chunk to a Bee node
 *
 * The chunk data consists of 8 byte span and up to 4096 bytes of payload data.
 * The span stores the length of the payload in uint64 little endian encoding.
 * Upload expects the chuck data to be set accordingly.
 *
 * @param url     Bee URL
 * @param data    Chunk data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options Additional options like tag, encryption, pinning
 */
export async function upload(
  url: string,
  data: Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<Reference> {
  const response = await safeAxios<ReferenceResponse>({
    ...options?.axiosOptions,
    method: 'post',
    url: `${url}${endpoint}`,
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
    responseType: 'json',
  })

  return response.data.reference
}

/**
 * Download chunk data as a byte array
 *
 * @param url  Bee URL
 * @param hash Bee content reference
 *
 */
export async function download(url: string, hash: string): Promise<Uint8Array> {
  const response = await safeAxios<ArrayBuffer>({
    responseType: 'arraybuffer',
    url: `${url}${endpoint}/${hash}`,
  })

  return new Uint8Array(response.data)
}

/**
 * Download chunk data as a readable stream
 *
 * @param url  Bee URL
 * @param hash Bee content reference
 * @param axiosOptions optional - alter default options of axios HTTP client
 */
export async function downloadReadable(url: string, hash: string, axiosOptions: AxiosRequestConfig): Promise<Readable> {
  const response = await safeAxios<Readable>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'stream',
    url: `${url}${endpoint}/${hash}`,
  })

  return response.data
}
