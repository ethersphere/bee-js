import type { BeeRequestOptions, ReferenceOrEns } from '../types'
import { http } from '../utils/http'

const stewardshipEndpoint = 'stewardship'

/**
 * Reupload locally pinned data
 * @param ky Ky instance
 * @param reference
 * @param options
 * @throws BeeResponseError if not locally pinned or invalid data
 */
export async function reupload(requestOptions: BeeRequestOptions, reference: ReferenceOrEns): Promise<void> {
  await http(requestOptions, {
    method: 'put',
    url: `${stewardshipEndpoint}/${reference}`,
  })
}

interface IsRetrievableResponse {
  isRetrievable: boolean
}

export async function isRetrievable(requestOptions: BeeRequestOptions, reference: ReferenceOrEns): Promise<boolean> {
  const response = await http<IsRetrievableResponse>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: `${stewardshipEndpoint}/${reference}`,
  })

  return response.data.isRetrievable
}
