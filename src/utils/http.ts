import { BeeError, BeeRequestError, BeeResponseError } from './error'

import { Options as KyOptions } from 'ky-universal'
import { Ky } from '../types'

/**
 * Utility function that sets passed headers to ALL axios calls without distinction of Bee URLs.
 *
 * @param headers
 */
// export function setDefaultHeaders(headers: Record<string, string>): void {
//   axios.defaults.headers.common = headers
// }

interface HttpOptions extends KyOptions {
  url: string
}

interface KyResponse extends Response {
  json: <T>() => Promise<T>
}

export async function http(ky: Ky, config: HttpOptions): Promise<KyResponse> {
  try {
    const { url, ...kyConfig } = config

    return await ky(url, {
      ...kyConfig,
    })
  } catch (e) {
    if (e.response) {
      if (e.response.data?.message) {
        throw new BeeResponseError(e.response.status, `${e.response.statusText}: ${e.response.data.message}`)
      } else {
        throw new BeeResponseError(e.response.status, e.response.statusText)
      }
    } else if (e.request) {
      throw new BeeRequestError(e.message)
    } else {
      throw new BeeError(e.message)
    }
  }
}
