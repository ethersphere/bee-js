import type { AxiosRequestConfig } from 'axios'
import type { Readable } from 'stream'
import { FileData, FileUploadOptions, UploadHeaders } from '../types'
import { prepareData } from '../utils/data'
import { extractUploadHeaders, readFileHeaders } from '../utils/headers'
import { safeAxios } from '../utils/safeAxios'

const endpoint = '/files'

interface FileUploadHeaders extends UploadHeaders {
  'content-length'?: string
  'content-type'?: string
}

function extractFileUploadHeaders(options?: FileUploadOptions): FileUploadHeaders {
  const headers: FileUploadHeaders = extractUploadHeaders(options)

  if (options?.size) headers['content-length'] = String(options.size)

  if (options?.contentType) headers['content-type'] = options.contentType

  return headers
}

/**
 * Upload single file to a Bee node
 *
 * @param url     Bee URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export async function upload(
  url: string,
  data: string | Uint8Array | Readable | ArrayBuffer,
  name?: string,
  options?: FileUploadOptions,
): Promise<string> {
  const response = await safeAxios<{ reference: string }>({
    ...options?.axiosOptions,
    method: 'post',
    url: url + endpoint,
    data: prepareData(data),
    headers: {
      'content-type': 'application/octet-stream',
      ...extractFileUploadHeaders(options),
    },
    responseType: 'json',
    params: { name },
  })

  return response.data.reference
}

/**
 * Download single file as a buffer
 *
 * @param url  Bee URL
 * @param hash Bee file hash
 */
export async function download(
  url: string,
  hash: string,
  axiosOptions?: AxiosRequestConfig,
): Promise<FileData<Uint8Array>> {
  const response = await safeAxios<ArrayBuffer>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'arraybuffer',
    url: `${url}${endpoint}/${hash}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: new Uint8Array(response.data),
  }

  return file
}

/**
 * Download single file as a readable stream
 *
 * @param url  Bee URL
 * @param hash Bee file hash
 */
export async function downloadReadable(
  url: string,
  hash: string,
  axiosOptions?: AxiosRequestConfig,
): Promise<FileData<Readable>> {
  const response = await safeAxios<Readable>({
    ...axiosOptions,
    method: 'GET',
    responseType: 'stream',
    url: `${url}${endpoint}/${hash}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: response.data,
  }

  return file
}
