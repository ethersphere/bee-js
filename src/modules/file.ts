import axios from 'axios'
import { Readable } from 'stream'
import { OptionsUpload } from '../types'
import { prepareData } from '../utils/data'
import { extractHeaders } from '../utils'

/**
 * Upload single file to a Bee node
 *
 * @param url     Bee file URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export async function upload (
  url: string,
  data: string | Buffer | Readable,
  options?: OptionsUpload
): Promise<string> {
  return (
    await axios({
      method: 'post',
      url,
      data: await prepareData(data),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'content-type': 'application/octet-stream',
        ...extractHeaders(options)
      },
      params: options?.name ? { name: options.name } : {}
    })
  ).data.reference
}

/**
 * Download single file as a buffer
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export async function download (url: string, hash: string): Promise<Buffer> {
  return Buffer.from(
    (
      await axios({
        responseType: 'arraybuffer',
        url: `${url}/${hash}`
      })
    ).data
  )
}

/**
 * Download single file as a readable stream
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export async function downloadReadable (
  url: string,
  hash: string
): Promise<Readable> {
  return (
    await axios({
      responseType: 'stream',
      url: `${url}/${hash}`
    })
  ).data
}
