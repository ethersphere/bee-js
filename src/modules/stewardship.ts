import { Reference } from '../types'
import { safeAxios } from '../utils/safe-axios'
import { AxiosRequestConfig } from 'axios'

const stewardshipEndpoint = '/stewardship'

/**
 * Reupload locally pinned data
 * @param url
 * @param reference
 * @param options
 * @throws BeeResponseError if not locally pinned or invalid data
 */
export async function reupload(ky: Ky, reference: Reference, options?: AxiosRequestConfig): Promise<void> {
  await safeAxios({
    ...options,
    method: 'put',
    url: `${url}${stewardshipEndpoint}/${reference}`,
    responseType: 'json',
  })
}
