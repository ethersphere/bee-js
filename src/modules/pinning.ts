import type { BeeGenericResponse, Pin, Reference } from '../types'
import { http } from '../utils/http'
import type { Options as KyOptions } from 'ky'

const PINNING_ENDPOINT = 'pins'

export interface GetAllPinResponse {
  references: Reference[]
}

/**
 * Pin data with given reference
 *
 * @param kyOptions Ky Options for making requests
 * @param reference Bee data reference
 */
export async function pin(kyOptions: KyOptions, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>(kyOptions, {
    method: 'post',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/**
 * Unpin data with given reference
 *
 * @param kyOptions Ky Options for making requests
 * @param reference Bee data reference
 */
export async function unpin(kyOptions: KyOptions, reference: Reference): Promise<void> {
  await http<BeeGenericResponse>(kyOptions, {
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
export async function getPin(kyOptions: KyOptions, reference: Reference): Promise<Pin> {
  const response = await http<Pin>(kyOptions, {
    method: 'get',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}/${reference}`,
  })

  return response.parseData
}

/**
 * Get list of all pins
 *
 * @param ky Ky instance
 */
export async function getAllPins(kyOptions: KyOptions): Promise<Reference[]> {
  const response = await http<GetAllPinResponse>(kyOptions, {
    method: 'get',
    responseType: 'json',
    path: `${PINNING_ENDPOINT}`,
  })

  return response.parseData.references
}
