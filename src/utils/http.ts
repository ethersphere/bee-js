import { BeeError, BeeNotAJsonError, BeeRequestError, BeeResponseError } from './error'
import type { BeeRequest, BeeResponse, HookCallback, HttpMethod, Ky } from '../types'
import type { HTTPError, Options as KyOptions } from 'ky-universal'
import { normalizeToReadableStream } from './stream'
import { isObject, isStrictlyObject } from './type'
import { KyRequestOptions } from '../types'
import { deepMerge } from './merge'
import { sleep } from './sleep'
import { import_ } from '@brillout/import'

export const DEFAULT_KY_CONFIG: KyOptions = {
  headers: {
    accept: 'application/json, text/plain, */*',
    'user-agent': `bee-js`,
  },
}

interface UndiciError {
  cause: Error
}

interface KyResponse<T> extends Response {
  parseData: T
}

function isHttpError(e: unknown): e is HTTPError {
  return isObject(e) && typeof e.response !== 'undefined'
}

function isHttpRequestError(e: unknown): e is Error {
  return isObject(e) && typeof e.request !== 'undefined'
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

/**
 * Main utility function to make HTTP requests.
 * @param kyOptions
 * @param config
 */
export async function http<T>(kyOptions: KyOptions, config: KyRequestOptions): Promise<KyResponse<T>> {
  try {
    const ky = await getKy()
    const { path, responseType, ...kyConfig } = deepMerge(kyOptions as KyRequestOptions, config)

    const response = (await ky(path, {
      ...kyConfig,
      searchParams: filterHeaders(kyConfig.searchParams),
    })) as KyResponse<T>

    switch (responseType) {
      case 'stream':
        if (!response.body) {
          throw new BeeError('Response was expected to get data but did not get any!')
        }

        response.parseData = normalizeToReadableStream(response.body) as unknown as T
        break
      case 'arraybuffer':
        response.parseData = (await response.arrayBuffer()) as unknown as T
        break
      case 'json':
        try {
          response.parseData = (await response.json()) as unknown as T
        } catch (e) {
          throw new BeeNotAJsonError()
        }
        break
      default:
        break // If responseType is not set, then no data are expected
    }

    return response
  } catch (e) {
    // Passthrough thrown errors
    if (e instanceof BeeNotAJsonError) {
      throw e
    }

    if (isHttpError(e)) {
      let message

      // We store the response body here as it can be read only once in Response's lifecycle so to make it exposed
      // to the user in the BeeResponseError, for further analysis.
      const body = await e.response.text()

      try {
        // The response can be Bee's JSON with structure `{code, message}` lets try to parse it
        message = JSON.parse(body).message
      } catch (e) {}

      if (message) {
        throw new BeeResponseError(e.response.status, e.response, body, config, `${e.response.statusText}: ${message}`)
      } else {
        throw new BeeResponseError(e.response.status, e.response, body, config, e.response.statusText)
      }
    } else if (isHttpRequestError(e)) {
      throw new BeeRequestError(e.message, config)
    } else {
      // Node 18 has native `fetch` implementation called Undici. Errors from this implementation have top level generic
      // message "fetch failed" with the more specific error placed into `cause` property. Instead of "fetch failed" we
      // expose the underlying problem.
      if ((e as UndiciError).cause) {
        throw new BeeError((e as UndiciError).cause.message)
      }

      throw new BeeError((e as Error).message)
    }
  }
}

let ky: Ky | undefined,
  kyLock = false

async function waitForLock(): Promise<void> {
  while (kyLock) {
    console.log(': Waiting for lock')

    await sleep(10)
  }
}

async function getKy(): Promise<Ky> {
  if (ky) {
    console.log('Ky found!: ')

    return ky
  }
  console.log(': Ky not found, getting it')

  // We use TSImportLib as TypeScript otherwise transpiles the `await import` into `require` call for CommonJS modules.
  // The TSImportLib is used only in Node context as there is defined the `module` object.
  // In browser&webpack is then used directly `await import()` as babel-loader only
  // removes TS syntax and hence preserves `await import` in the browser build.
  // if (tsimportlib && tsimportlib.dynamicImport) {
  //   ky = (await tsimportlib.dynamicImport('ky-universal', module)).default
  // } else {
  //   ky = (await import('ky-universal')).default
  // }

  if (kyLock) {
    await waitForLock()

    if (ky) {
      return ky
    }
  }

  try {
    kyLock = true
    ky = (await import_('ky-universal')).default

    if (!ky) {
      throw new Error('Ky module not found!')
    }
  } finally {
    kyLock = false
  }
  console.log(': Got Ky!')

  return ky
}
