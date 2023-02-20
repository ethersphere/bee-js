import type { ReferenceOrEns } from '../types'
import { http } from '../utils/http'

// @ts-ignore: Needed TS otherwise complains about importing ESM package in CJS even though they are just typings
import type { Options as KyOptions } from 'ky'

const stewardshipEndpoint = 'stewardship'

/**
 * Reupload locally pinned data
 * @param ky Ky instance
 * @param reference
 * @param options
 * @throws BeeResponseError if not locally pinned or invalid data
 */
export async function reupload(kyOptions: KyOptions, reference: ReferenceOrEns): Promise<void> {
  await http(kyOptions, {
    method: 'put',
    path: `${stewardshipEndpoint}/${reference}`,
  })
}

interface IsRetrievableResponse {
  isRetrievable: boolean
}

export async function isRetrievable(kyOptions: KyOptions, reference: ReferenceOrEns): Promise<boolean> {
  const response = await http<IsRetrievableResponse>(kyOptions, {
    method: 'get',
    responseType: 'json',
    path: `${stewardshipEndpoint}/${reference}`,
  })

  return response.parsedData.isRetrievable
}
