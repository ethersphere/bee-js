import type { BeeGenericResponse, Ky, Pin, Reference } from '../types'
import { http } from '../utils/http'

const PINNING_ENDPOINT = 'pins'

export interface GetAllPinResponse {
  references: Reference[] | null
}

/**
 * Pin data with given reference
 *
 * @param ky Ky instance for given Bee class instance
 * @param reference Bee data reference
 */
export async function pin(ky: Ky, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>(ky, {
    method: 'post',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Unpin data with given reference
 *
 * @param ky Ky instance for given Bee class instance
 * @param reference Bee data reference
 */
export async function unpin(ky: Ky, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>(ky, {
    method: 'delete',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Get pin status for specific address.
 *
 * @param ky Ky instance
 * @param reference
 * @throws Error if given address is not pinned
 */
export async function getPin(ky: Ky, reference: Reference): Promise<Pin> {
  const response = await http<Pin>(ky, {
    method: 'get',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}/${reference}`,
  })

  return response.data
}

/**
 * Get list of all pins
 *
 * @param ky Ky instance
 */
export async function getAllPins(ky: Ky): Promise<Reference[]> {
  const response = await http<GetAllPinResponse>(ky, {
    method: 'get',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}`,
  })

  const result = response.data.references

  if (result === null) {
    return []
  }

  return result
}
