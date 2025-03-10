import { Types } from 'cafe-utility'
import type { BeeRequestOptions } from '../types'
import { http } from '../utils/http'
import { BatchId, Reference } from '../utils/typed-bytes'

const stewardshipEndpoint = 'stewardship'

/**
 * Reupload locally pinned data
 * @param requestOptions Options for making requests
 * @param reference
 * @throws BeeResponseError if not locally pinned or invalid data
 */
export async function reupload(requestOptions: BeeRequestOptions, stamp: BatchId, reference: Reference): Promise<void> {
  await http(requestOptions, {
    method: 'put',
    url: `${stewardshipEndpoint}/${reference}`,
    headers: { 'swarm-postage-batch-id': stamp.toHex() },
  })
}

export async function isRetrievable(
  requestOptions: BeeRequestOptions,
  reference: Reference | Uint8Array | string,
): Promise<boolean> {
  reference = new Reference(reference)

  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${stewardshipEndpoint}/${reference}`,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return Types.asBoolean(body.isRetrievable, { name: 'isRetrievable' })
}
