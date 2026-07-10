import type { BeeRequestOptions } from '../types'
import { IsRetrievableResponse } from '../types/schema/stewardship'
import { http } from '../utils/http'
import { BatchId, Reference } from '../utils/typed-bytes'

const stewardshipEndpoint = 'stewardship'

/**
 * Raw HTTP calls for the `/stewardship` endpoint.
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

  return IsRetrievableResponse.parse(response.data).isRetrievable
}
