import { safeAxios } from '../utils/safeAxios'

enum Endpoint {
  FILE = '/pin/files',
  COLLECTION = '/pin/bzz',
  BYTES = '/pin/bytes',
}

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

function pin(url: string, endpoint: Endpoint, hash: string): Promise<Response> {
  return pinRequest(`${url}${endpoint}/${hash}`, 'post')
}

function unpin(url: string, endpoint: Endpoint, hash: string): Promise<Response> {
  return pinRequest(`${url}${endpoint}/${hash}`, 'delete')
}

/**
 * Pin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export function pinFile(url: string, hash: string): Promise<Response> {
  return pin(url, Endpoint.FILE, hash)
}

/**
 * Unpin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export function unpinFile(url: string, hash: string): Promise<Response> {
  return unpin(url, Endpoint.FILE, hash)
}

/**
 * Pin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export function pinCollection(url: string, hash: string): Promise<Response> {
  return pin(url, Endpoint.COLLECTION, hash)
}

/**
 * Unpin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export function unpinCollection(url: string, hash: string): Promise<Response> {
  return unpin(url, Endpoint.COLLECTION, hash)
}

/**
 * Pin data with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export function pinData(url: string, hash: string): Promise<Response> {
  return pin(url, Endpoint.BYTES, hash)
}

/**
 * Unpin data with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export function unpinData(url: string, hash: string): Promise<Response> {
  return unpin(url, Endpoint.BYTES, hash)
}
