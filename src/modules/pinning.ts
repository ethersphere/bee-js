import type { BeeGenericResponse, Pin, Reference } from '../types'
import { http } from '../utils/http'

const PINNING_ENDPOINT = '/pins'

export interface GetAllPinResponse {
  references: Reference[] | null
}

/**
 * Pin data with given reference
 *
 * @param url  Bee URL
 * @param reference Bee data reference
 */
export async function pin(ky: Ky, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>({
    method: 'post',
    responseType: 'json',
    url: `${url}${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Unpin data with given reference
 *
 * @param url  Bee URL
 * @param reference Bee data reference
 */
export async function unpin(ky: Ky, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>({
    method: 'delete',
    responseType: 'json',
    url: `${url}${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Get pin status for specific address.
 *
 * @param url     Bee URL
 * @param reference
 * @throws Error if given address is not pinned
 */
export async function getPin(ky: Ky, reference: Reference): Promise<Pin> {
  const response = await http<Pin>({
    method: 'get',
    responseType: 'json',
    url: `${url}${PINNING_ENDPOINT}/${reference}`,
  })

  return response.data
}

/**
 * Get list of all pins
 *
 * @param url     Bee URL
 */
export async function getAllPins(ky: Ky): Promise<Reference[]> {
  const response = await http<GetAllPinResponse>({
    method: 'get',
    responseType: 'json',
    url: `${url}${PINNING_ENDPOINT}`,
  })

  const result = response.data.references

  if (result === null) {
    return []
  }

  return result
}
