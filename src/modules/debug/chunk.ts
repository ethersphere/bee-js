import type { BeeGenericResponse, BeeRequestOptions } from '../../types'
import { http } from '../../utils/http'

const endpoint = 'chunks'

/**
 * Check if chunk at address exists locally
 *
 * @param requestOptions Options for making requests
 * @param address  Swarm address of chunk
 *
 * @returns BeeGenericResponse if chunk is found or throws an exception
 */
export async function checkIfChunkExistsLocally(
  requestOptions: BeeRequestOptions,
  address: string,
): Promise<BeeGenericResponse> {
  const response = await http<BeeGenericResponse>(requestOptions, {
    url: `${endpoint}/${address}`,
    responseType: 'json',
  })

  return response.data
}
