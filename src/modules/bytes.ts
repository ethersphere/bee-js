import type { Readable } from 'stream'
import { UploadOptions } from '../types'
import { prepareData } from '../utils/data'
import { extractUploadHeaders } from '../utils/headers'
import { safeAxios } from '../utils/safeAxios'

const endpoint = '/bytes'

/**
 * Upload data to a Bee node
 *
 * @param url     Bee URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export async function upload(url: string, data: string | Uint8Array, options?: UploadOptions): Promise<string> {
  const response = await safeAxios<{ reference: string }>({
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
export async function download(url: string, hash: string): Promise<Uint8Array> {
  const response = await safeAxios<ArrayBuffer>({
    responseType: 'arraybuffer',
    url: `${url}${endpoint}/${hash}`,
  })

  return new Uint8Array(response.data)
}

/**
 * Download data as a readable stream
 *
 * @param url  Bee URL
 * @param hash Bee content reference
 */
export async function downloadReadable(url: string, hash: string): Promise<Readable> {
  const response = await safeAxios<Readable>({
    responseType: 'stream',
    url: `${url}${endpoint}/${hash}`,
  })

  return response.data
}
