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
  responseType: 'json' | 'arraybuffer' | 'stream'
}

interface KyResponse<T> extends Response {
  data: T
}

export async function http<T>(ky: Ky, config: HttpOptions): Promise<KyResponse<T>> {
  try {
    const { url, responseType, ...kyConfig } = config

    const response = (await ky(url, {
      ...kyConfig,
    })) as KyResponse<T>

    switch (responseType) {
      case 'stream':
        break
      case 'arraybuffer':
        response.data = (await response.arrayBuffer()) as unknown as T
        break
      case 'json':
      default:
        response.data = (await response.json()) as unknown as T
        break
    }

    return response
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
