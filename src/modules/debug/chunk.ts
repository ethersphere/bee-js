import type { BeeGenericResponse } from '../../types'
import { http } from '../../utils/http'
import type { Options as KyOptions } from 'ky'

const endpoint = 'chunks'

/**
 * Check if chunk at address exists locally
 *
 * @param kyOptions Ky Options for making requests
 * @param address  Swarm address of chunk
 *
 * @returns BeeGenericResponse if chunk is found or throws an exception
 */
export async function checkIfChunkExistsLocally(kyOptions: KyOptions, address: string): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>(kyOptions, {
    path: endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.parseData
}

/**
 * Delete a chunk from local storage
 *
 * @param kyOptions Ky Options for making requests
 * @param address  Swarm address of chunk
 *
 * @returns BeeGenericResponse if chunk was deleted or throws an exception
 */
export async function deleteChunkFromLocalStorage(kyOptions: KyOptions, address: string): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>(kyOptions, {
    method: 'delete',
    path: endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.parseData
}
