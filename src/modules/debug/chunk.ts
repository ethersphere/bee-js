import { http } from '../../utils/http.js'

import type { BeeGenericResponse, Ky } from '../../types/index.js'

const endpoint = 'chunks'

/**
 * Check if chunk at address exists locally
 *
 * @param ky Ky debug instance
 * @param address  Swarm address of chunk
 *
 * @returns BeeGenericResponse if chunk is found or throws an exception
 */
export async function checkIfChunkExistsLocally(ky: Ky, address: string): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>(ky, {
    path: endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Delete a chunk from local storage
 *
 * @param ky Ky debug instance
 * @param address  Swarm address of chunk
 *
 * @returns BeeGenericResponse if chunk was deleted or throws an exception
 */
export async function deleteChunkFromLocalStorage(ky: Ky, address: string): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>(ky, {
    method: 'delete',
    path: endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}
