import { BatchId, Reference } from '@ethersphere/core-sdk'
import type { BeeRequestOptions } from '../types/index.js'
import { IsRetrievableResponse } from '../types/schema/stewardship.js'
import { http } from '../utils/http.js'

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

export async function isRetrievable(requestOptions: BeeRequestOptions, reference: Reference): Promise<boolean> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${stewardshipEndpoint}/${reference}`,
  })

  return IsRetrievableResponse.parse(response.data).isRetrievable
}
