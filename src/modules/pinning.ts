import type { BeeResponse } from '../types'
import { safeAxios } from '../utils/safeAxios'

enum Endpoint {
  FILE = '/pin/files',
  COLLECTION = '/pin/bzz',
  BYTES = '/pin/bytes',
  CHUNKS = '/pin/chunks',
}

export interface PinningStatus {
  address: string
  pinCounter: number
}

export interface PinnedChunks {
  chunks: PinningStatus[]
}

async function pinRequest(url: string, method: 'post' | 'delete'): Promise<BeeResponse> {
  const response = await safeAxios<BeeResponse>({
    method,
    responseType: 'json',
    url,
  })

  return response.data
}

function pin(url: string, endpoint: Endpoint, hash: string): Promise<BeeResponse> {
  return pinRequest(`${url}${endpoint}/${hash}`, 'post')
}

function unpin(url: string, endpoint: Endpoint, hash: string): Promise<BeeResponse> {
  return pinRequest(`${url}${endpoint}/${hash}`, 'delete')
}

/**
 * Pin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export function pinFile(url: string, hash: string): Promise<BeeResponse> {
  return pin(url, Endpoint.FILE, hash)
}

/**
 * Unpin file with given reference
 *
 * @param url  Bee URL
 * @param hash Bee file reference
 */
export function unpinFile(url: string, hash: string): Promise<BeeResponse> {
  return unpin(url, Endpoint.FILE, hash)
}

/**
 * Pin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export function pinCollection(url: string, hash: string): Promise<BeeResponse> {
  return pin(url, Endpoint.COLLECTION, hash)
}

/**
 * Unpin collection with given reference
 *
 * @param url  Bee URL
 * @param hash Bee collection reference
 */
export function unpinCollection(url: string, hash: string): Promise<BeeResponse> {
  return unpin(url, Endpoint.COLLECTION, hash)
}

/**
 * Pin data with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export function pinData(url: string, hash: string): Promise<BeeResponse> {
  return pin(url, Endpoint.BYTES, hash)
}

/**
 * Unpin data with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export function unpinData(url: string, hash: string): Promise<BeeResponse> {
  return unpin(url, Endpoint.BYTES, hash)
}

/**
 * Pin chunks with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export function pinChunk(url: string, hash: string): Promise<BeeResponse> {
  return pin(url, Endpoint.CHUNKS, hash)
}

/**
 * Unpin chunks with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export function unpinChunk(url: string, hash: string): Promise<BeeResponse> {
  return unpin(url, Endpoint.CHUNKS, hash)
}

/**
 * Get pinning status of chunk with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export async function getChunkPinningStatus(url: string, hash: string): Promise<PinningStatus> {
  const response = await safeAxios<PinningStatus>({
    method: 'get',
    responseType: 'json',
    url: `${url}${Endpoint.CHUNKS}/${hash}`,
  })

  return response.data
}

/**
 * Update pinning status of chunk with given reference
 *
 * @param url  Bee URL
 * @param hash Bee data reference
 */
export async function updateChunkPinningStatus(url: string, hash: string): Promise<PinningStatus> {
  const response = await safeAxios<PinningStatus>({
    method: 'put',
    responseType: 'json',
    url: `${url}${Endpoint.CHUNKS}/${hash}`,
  })

  return response.data
}

/**
 * Get list of pinned chunks
 *
 * @param url Bee URL
 */
export async function getPinnedChunks(url: string): Promise<PinnedChunks> {
  const response = await safeAxios<PinnedChunks>({
    method: 'get',
    responseType: 'json',
    url: `${url}${Endpoint.CHUNKS}`,
  })

  return response.data
}
