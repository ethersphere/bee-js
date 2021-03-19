import type { AxiosRequestConfig } from 'axios'
import type { Readable } from 'stream'
import { Data, Reference, UploadOptions } from '../types'
import { prepareData } from '../utils/data'
import { extractUploadHeaders } from '../utils/headers'
import { safeAxios } from '../utils/safeAxios'
import { wrapBytesWithHelpers } from '../utils/bytes'

const endpoint = '/bytes'

/**
 * Upload data to a Bee node
 *
 * @param url     Bee URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export async function upload(url: string, data: string | Uint8Array, options?: UploadOptions): Promise<Reference> {
  const response = await safeAxios<{ reference: Reference }>({
    ...options?.axiosOptions,
    method: 'post',
    url: url + endpoint,
    data: await prepareData(data),
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(options),
    },
    responseType: 'json',
  })

  return response.data.reference
}

/**
 * Download data as a byte array
 *
 * @param url  Bee URL
 * @param hash Bee content reference
 */
export async function download(url: string, hash: Reference): Promise<Data> {
  const response = await safeAxios<ArrayBuffer>({
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
export async function downloadReadable(
  url: string,
  hash: Reference,
  axiosOptions?: AxiosRequestConfig,
): Promise<Readable> {
  const response = await safeAxios<Readable>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'stream',
    url: `${url}${endpoint}/${hash}`,
  })

  return response.data
}
