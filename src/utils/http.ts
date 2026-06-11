import { Dates, Objects, Strings, System } from 'cafe-utility'
import _debug from 'debug'
import { BeeRequestOptions, BeeResponseError } from '../index'

const debug = _debug('bee-js:http')

const MAX_FAILED_ATTEMPTS = 100_000
const DELAY_FAST = 200
const DELAY_SLOW = 1000
const DELAY_THRESHOLD = Dates.minutes(1) / DELAY_FAST

export const DEFAULT_HTTP_CONFIG: BeeRequestConfig = {
  headers: {
    accept: 'application/json, text/plain, */*',
  },
}

export type BeeResponseType = 'json' | 'arraybuffer' | 'text' | 'blob' | 'stream'

export interface BeeResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  raw: Response
}

export interface BeeRequestConfig extends RequestInit {
  url?: string
  baseURL?: string
  params?: Record<string, unknown>
  data?: unknown
  responseType?: BeeResponseType
}

/**
 * Main function to make HTTP requests.
 * @param options User defined settings
 * @param config Internal settings and/or Bee settings
 */
export async function http<T>(options: BeeRequestOptions, config: BeeRequestConfig): Promise<BeeResponse<T>> {
  const merged: BeeRequestConfig = Objects.deepMerge3(DEFAULT_HTTP_CONFIG, config, options)

  if (options.signal) merged.signal = options.signal

  if (merged.data !== undefined) merged.body = merged.data as BodyInit

  const url = buildUrl(merged)
  const method = merged.method || 'get'

  options.onRequest?.({
    method,
    url,
    headers: { ...merged.headers } as Record<string, string>,
    params: merged.params,
  })

  let failedAttempts = 0
  while (failedAttempts < MAX_FAILED_ATTEMPTS) {
    try {
      debug(`${method} ${url}`, { headers: merged.headers, params: merged.params })
      const res = await fetch(url, merged)

      if (!res.ok) {
        const errBody = await toBeeResponse(res, merged.responseType)
        throw new BeeResponseError(method, url, res.statusText, errBody.data, res.status, res.statusText)
      }

      return toBeeResponse<T>(res, merged.responseType)
    } catch (e) {
      if (e instanceof BeeResponseError) throw e

      const err = e as Error

      if (err.name === 'AbortError') {
        throw new BeeResponseError(method, url, 'Request aborted', undefined, undefined, 'ERR_CANCELED')
      }

      if (err.name === 'TimeoutError' && options.endlesslyRetry) {
        failedAttempts++
        await System.sleepMillis(failedAttempts < DELAY_THRESHOLD ? DELAY_FAST : DELAY_SLOW)
      } else {
        throw new BeeResponseError(method, url, err.message)
      }
    }
  }
  throw Error('Max number of failed attempts reached')
}

export async function toBeeResponse<T>(res: Response, responseType: BeeResponseType = 'json'): Promise<BeeResponse<T>> {
  let data: unknown
  switch (responseType) {
    case 'arraybuffer':
      data = await res.arrayBuffer()
      break
    case 'text':
      data = await res.text()
      break
    case 'blob':
      data = await res.blob()
      break
    case 'stream':
      data = res.body
      break
    case 'json':
    default:
      data = await res.json()
  }

  return {
    data: data as T,
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    raw: res,
  }
}

function buildUrl(config: BeeRequestConfig): string {
  let url = Strings.joinUrl([config.baseURL ?? '', config.url ?? ''])

  if (config.params) {
    const qs = new URLSearchParams(
      Object.entries(config.params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()

    if (qs) url += `?${qs}`
  }

  return url
}
