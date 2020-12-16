import { safeAxios } from '../utils/safeAxios'

const fileEndpoint = '/pin/files'
const collectionEndpoint = '/pin/bzz'
const bytesEndpoint = '/pin/bytes'

export interface Response {
  message: string
  code: number
}

async function pinRequest(url: string, method: 'post' | 'delete'): Promise<Response> {
  const response = await safeAxios<Response>({
    method,
    responseType: 'json',
    url,
  })

  return response.data

}

async function pin(url: string, endpoint: string, hash: string): Promise<Response> {
  return pinRequest(`${url}${endpoint}/${hash}`, 'post')
}

async function unpin(url: string, endpoint: string, hash: string): Promise<Response> {
  return pinRequest(`${url}${endpoint}/${hash}`, 'delete')
}

/**
 * Pin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export async function pinFile(url: string, hash: string): Promise<Response> {
  return pin(url, fileEndpoint, hash)
}

/**
 * Unpin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export async function unpinFile(url: string, hash: string): Promise<Response> {
  return unpin(url, fileEndpoint, hash)
}

/**
 * Pin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export async function pinCollection(url: string, hash: string): Promise<Response> {
  return pin(url, collectionEndpoint, hash)
}

/**
 * Unpin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export async function unpinCollection(url: string, hash: string): Promise<Response> {
  return unpin(url, collectionEndpoint, hash)
}

/**
 * Pin data with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export async function pinData(url: string, hash: string): Promise<Response> {
  return pin(url, bytesEndpoint, hash)
}

/**
 * Unpin data with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export async function unpinData(url: string, hash: string): Promise<Response> {
  return unpin(url, bytesEndpoint, hash)
}
