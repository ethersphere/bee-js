import type { Ky, Reference } from '../types'
import { http } from '../utils/http'

const stewardshipEndpoint = 'stewardship'

/**
 * Reupload locally pinned data
 * @param ky Ky instance
 * @param reference
 * @param options
 * @throws BeeResponseError if not locally pinned or invalid data
 */
export async function reupload(ky: Ky, reference: Reference): Promise<void> {
  await http(ky, {
    method: 'put',
    path: `${stewardshipEndpoint}/${reference}`,
  })
}

interface IsRetrievableResponse {
  isRetrievable: boolean
}

export async function isRetrievable(ky: Ky, reference: Reference): Promise<boolean> {
  const response = await http<IsRetrievableResponse>(ky, {
    method: 'get',
    responseType: 'json',
    path: `${stewardshipEndpoint}/${reference}`,
  })

  return response.data.isRetrievable
}
