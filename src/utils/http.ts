import { BeeError, BeeRequestError, BeeResponseError } from './error'
import type { BeeRequest, BeeResponse, HookCallback, HttpMethod, Ky } from '../types'
import kyFactory, { Options as KyOptions } from 'ky-universal'
import { normalizeToReadableStream } from './stream'
import { deepMerge } from './merge'
import { version as beeJsVersion } from '../../package.json'
import { isStrictlyObject } from './type'

const DEFAULT_KY_CONFIG: KyOptions = {
  headers: {
    accept: 'application/json, text/plain, */*',
    'user-agent': `bee-js/${beeJsVersion}`,
  },
}

interface HttpOptions extends Omit<KyOptions, 'searchParams'> {
  path: string
  responseType?: 'json' | 'arraybuffer' | 'stream'

  /**
   * Overridden parameter that allows undefined as a value.
   */
  searchParams?: Record<string, string | number | boolean | undefined>
}

interface KyResponse<T> extends Response {
  data: T
}

function headersToObject(header: Headers) {
  return [...header.entries()].reduce<Record<string, string>>((obj, [key, val]) => {
    obj[key] = val

    return obj
  }, {})
}

function wrapRequest(request: Request): BeeRequest {
  return {
    url: request.url,
    method: request.method.toUpperCase() as HttpMethod,
    headers: headersToObject(request.headers),
  }
}

export function wrapRequestClosure(cb: HookCallback<BeeRequest>): (request: Request) => Promise<void> {
  return async (request: Request) => {
    await cb(wrapRequest(request))
  }
}

export function wrapResponseClosure(
  cb: HookCallback<BeeResponse>,
): (request: Request, options: unknown, response: Response) => Promise<void> {
  return async (request: Request, options: unknown, response: Response) => {
    await cb({
      headers: headersToObject(response.headers),
      status: response.status,
      statusText: response.statusText,
      request: wrapRequest(request),
    })
  }
}

/**
 * Filters out entries that has undefined value from headers object.
 * Modifies the original object!
 *
 * @param obj
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function filterHeaders(obj?: object): Record<string, string> | undefined {
  if (obj === undefined) {
    return undefined
  }

  isStrictlyObject(obj)

  const typedObj = obj as Record<string, string>

  for (const key in typedObj) {
    if (typedObj[key] === undefined) {
      delete typedObj[key]
    }
  }

  if (Object.keys(typedObj).length === 0) {
    return undefined
  }

  return typedObj
}

export async function http<T>(ky: Ky, config: HttpOptions): Promise<KyResponse<T>> {
  try {
    const { path, responseType, ...kyConfig } = config

    const response = (await ky(path, {
      ...kyConfig,
      searchParams: filterHeaders(kyConfig.searchParams),
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

export function makeDefaultKy(kyConfig: KyOptions): Ky {
  return kyFactory.create(deepMerge(DEFAULT_KY_CONFIG, kyConfig))
}
