import { BeeError, BeeRequestError, BeeResponseError } from './error'

import { Options as KyOptions } from 'ky-universal'
import { Ky } from '../types'
import { normalizeToReadableStream } from './stream'

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
        if (!response.body) {
          throw new BeeError('Response was expected to get data but did not get any!')
        }

        response.data = normalizeToReadableStream(response.body) as unknown as T
        break
      case 'arraybuffer':
        response.data = (await response.arrayBuffer()) as unknown as T
        break
      case 'json':
        response.data = (await response.json()) as unknown as T
        break
      default:
        break // If responseType is not set, then no data are expected
    }

    return response
  } catch (e) {
    if (e.response) {
      const message = (await e.response.json()).message

      if (message) {
        throw new BeeResponseError(e.response.status, `${e.response.statusText}: ${message}`)
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
