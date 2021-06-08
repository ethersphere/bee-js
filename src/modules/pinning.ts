import type { BeeResponse, Pin, Reference } from '../types'
import { safeAxios } from '../utils/safe-axios'

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
export async function pin(url: string, reference: Reference): Promise<void> {
  await safeAxios<BeeResponse>({
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
export async function unpin(url: string, reference: Reference): Promise<void> {
  await safeAxios<BeeResponse>({
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
export async function getPin(url: string, reference: Reference): Promise<Pin> {
  const response = await safeAxios<Pin>({
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
export async function getAllPins(url: string): Promise<Reference[]> {
  const response = await safeAxios<GetAllPinResponse>({
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
