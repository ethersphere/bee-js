import type { BeeGenericResponse, BeeRequestOptions, Pin, Reference } from '../types'
import { http } from '../utils/http'

const PINNING_ENDPOINT = 'pins'

export interface GetAllPinResponse {
  references: Reference[]
}

/**
 * Pin data with given reference
 *
 * @param requestOptions Options for making requests
 * @param reference Bee data reference
 */
export async function pin(requestOptions: BeeRequestOptions, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Unpin data with given reference
 *
 * @param requestOptions Options for making requests
 * @param reference Bee data reference
 */
export async function unpin(requestOptions: BeeRequestOptions, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>(requestOptions, {
    method: 'delete',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Get pin status for specific address.
 *
 * @param requestOptions Options for making requests
 * @param reference
 * @throws Error if given address is not pinned
 */
export async function getPin(requestOptions: BeeRequestOptions, reference: Reference): Promise<Pin> {
  const response = await http<Pin>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })

  return response.data
}

/**
 * Get list of all pins
 *
 * @param requestOptions Options for making requests
 */
export async function getAllPins(requestOptions: BeeRequestOptions): Promise<Reference[]> {
  const response = await http<GetAllPinResponse>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}`,
  })

  return response.data.references || []
}
