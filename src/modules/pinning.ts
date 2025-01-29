import { Types } from 'cafe-utility'
import type { BeeRequestOptions, Pin } from '../types'
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asString(body.reference, { name: 'reference' })),
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  // TODO: https://github.com/ethersphere/bee/issues/4964
  if (body.references === null) {
    return []
  }

  const references = Types.asArray(body.references, { name: 'references' }).map(x =>
    Types.asString(x, { name: 'reference' }),
  )

  return references.map(x => new Reference(x))
}
