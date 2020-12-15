import { safeAxios } from '../utils/safeAxios'

const fileEndpoint = '/pin/files'
const collectionEndpoint = '/pin/bzz'

export interface Response {
  message: string
  code: number
}

/**
 * Pin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export async function pinFile(url: string, hash: string): Promise<Response> {
  const response = await safeAxios<Response>({
    method: 'post',
    responseType: 'json',
    url: `${url}${fileEndpoint}/${hash}`,
  })

  return response.data
}

/**
 * Unpin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export async function unpinFile(url: string, hash: string): Promise<Response> {
  const response = await safeAxios<Response>({
    method: 'delete',
    responseType: 'json',
    url: `${url}${fileEndpoint}/${hash}`,
  })

  return response.data
}

/**
 * Pin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export async function pinCollection(url: string, hash: string): Promise<Response> {
  const response = await safeAxios<Response>({
    method: 'post',
    responseType: 'json',
    url: `${url}${collectionEndpoint}/${hash}`,
  })

  return response.data
}

/**
 * Unpin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export async function unpinCollection(url: string, hash: string): Promise<Response> {
  const response = await safeAxios<Response>({
    method: 'delete',
    responseType: 'json',
    url: `${url}${collectionEndpoint}/${hash}`,
  })

  return response.data
}
