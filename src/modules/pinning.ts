import type { BeeRequestOptions, Pin } from '../types'
import { GetAllPinsResponse } from '../types/schema/pinning'
import { UploadResultBody } from '../types/schema/upload'
import { http } from '../utils/http'
import { Reference } from '../utils/typed-bytes'

const PINNING_ENDPOINT = 'pins'

/**
 * Pin data with given reference
 *
 * @param requestOptions Options for making requests
 * @param reference Bee data reference
 */
export async function pin(requestOptions: BeeRequestOptions, reference: Reference): Promise<void> {
  await http<unknown>(requestOptions, {
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
  await http<unknown>(requestOptions, {
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
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })

  return UploadResultBody.parse(response.data)
}

/**
 * Get list of all pins
 *
 * @param requestOptions Options for making requests
 */
export async function getAllPins(requestOptions: BeeRequestOptions): Promise<Reference[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}`,
  })

  // TODO: https://github.com/ethersphere/bee/issues/4964
  const { references } = GetAllPinsResponse.parse(response.data)

  return (references ?? []).map(x => new Reference(x))
}
