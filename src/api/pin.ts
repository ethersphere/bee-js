import type { BeeRequestOptions, Pin as PinData } from '../types'
import { GetAllPinsResponse } from '../types/schema/pinning'
import { UploadResultBody } from '../types/schema/upload'
import { http } from '../utils/http'
import { Reference } from '../utils/typed-bytes'

const PINNING_ENDPOINT = 'pins'

/** Pins local data with the given reference. */
export async function pin(requestOptions: BeeRequestOptions, reference: Reference): Promise<void> {
  await http<unknown>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/** Unpins local data with the given reference. */
export async function unpin(requestOptions: BeeRequestOptions, reference: Reference): Promise<void> {
  await http<unknown>(requestOptions, {
    method: 'delete',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })
}

/** Gets the list of all locally pinned references. */
export async function getAllPins(requestOptions: BeeRequestOptions): Promise<Reference[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: PINNING_ENDPOINT,
  })

  const { references } = GetAllPinsResponse.parse(response.data)

  return (references ?? []).map(x => new Reference(x))
}

/** Gets the pinning status of the chunk with the given reference. */
export async function getPin(requestOptions: BeeRequestOptions, reference: Reference): Promise<PinData> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${PINNING_ENDPOINT}/${reference}`,
  })

  return UploadResultBody.parse(response.data)
}
