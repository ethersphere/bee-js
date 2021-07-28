import { BeeGenericResponse } from '../../types'
import { http } from '../../utils/http'

const endpoint = '/chunks'

/**
 * Check if chunk at address exists locally
 *
 * @param url      Bee debug url
 * @param address  Swarm address of chunk
 *
 * @returns BeeGenericResponse if chunk is found or throws an exception
 */
export async function checkIfChunkExistsLocally(ky: Ky, address: string): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>({
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
 * @returns BeeGenericResponse if chunk was deleted or throws an exception
 */
export async function deleteChunkFromLocalStorage(ky: Ky, address: string): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>({
    method: 'delete',
    url: url + endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}
