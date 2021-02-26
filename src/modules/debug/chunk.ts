import { BeeResponse } from '../../types'
import { safeAxios } from '../../utils/safeAxios'

const endpoint = '/chunks'

/**
 * Check if chunk at address exists locally
 *
 * @param url      Bee debug url
 * @param address  Swarm address of chunk
 *
 * @returns BeeResponse if chunk is found or throws an exception
 */
export async function checkIfChunkExistsLocally(url: string, address: string): Promise<BeeResponse> {
  const response = await safeAxios<BeeResponse>({
    url: url + endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Delete a chunk from local storage
 *
 * @param url      Bee debug url
 * @param address  Swarm address of chunk
 *
 * @returns BeeResponse if chunk was deleted or throws an exception
 */
export async function deleteChunkFromLocalStorage(url: string, address: string): Promise<BeeResponse> {
  const response = await safeAxios<BeeResponse>({
    method: 'delete',
    url: url + endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}
