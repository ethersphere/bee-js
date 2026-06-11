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
  attachBody(merged)

  if (merged.params) {
    for (const k of Object.keys(merged.params)) {
      if (merged.params[k] === undefined) delete merged.params[k]
    }
  }

  const url = buildUrl(merged)
  const method = (merged.method || 'GET').toUpperCase()
  merged.method = method

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

      if (!res.ok) await throwHttpError(method, url, res, merged.responseType)

      return toBeeResponse<T>(res, merged.responseType)
    } catch (e) {
      if (e instanceof BeeResponseError) throw e

      const err = e as Error

      if (err.name === 'TimeoutError' && options.endlesslyRetry) {
        failedAttempts++
        await System.sleepMillis(failedAttempts < DELAY_THRESHOLD ? DELAY_FAST : DELAY_SLOW)
      } else {
        throw toBeeError(err, method, url)
      }
    }
  }
  throw Error('Max number of failed attempts reached')
}

function attachBody(merged: BeeRequestConfig): void {
  if (merged.data === undefined) return

  const data = merged.data
  const isBodyInit =
    typeof data === 'string' ||
    data instanceof ArrayBuffer ||
    data instanceof Uint8Array ||
    data instanceof Blob ||
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) ||
    (typeof ReadableStream !== 'undefined' && data instanceof ReadableStream) ||
    typeof (data as { pipe?: unknown })?.pipe === 'function' // Node Readable stream

  if (isBodyInit) {
    merged.body = data as BodyInit
    ;(merged as RequestInit & { duplex?: string }).duplex = 'half'
    if (data instanceof Blob && data.type) {
      merged.headers = { 'content-type': data.type, ...(merged.headers as Record<string, string>) }
    }
  } else {
    merged.body = JSON.stringify(data)
    merged.headers = { 'content-type': 'application/json', ...(merged.headers as Record<string, string>) }
  }
}

async function throwHttpError(
  method: string,
  url: string,
  res: Response,
  responseType?: BeeResponseType,
): Promise<never> {
  const errBody = await toBeeResponse(res, responseType).catch(() => ({ data: undefined }))
  const bodyMsg = typeof errBody.data === 'string' ? errBody.data : JSON.stringify(errBody.data)
  const message = bodyMsg && bodyMsg !== 'undefined' ? `${res.statusText}: ${bodyMsg}` : res.statusText
  throw new BeeResponseError(method, url, message, errBody.data, res.status, res.statusText)
}

function toBeeError(err: Error, method: string, url: string): BeeResponseError {
  if (err.name === 'AbortError') {
    return new BeeResponseError(method, url, 'Request aborted', undefined, undefined, 'ERR_CANCELED')
  }
  const cause = (err as { cause?: Error }).cause
  const message = cause?.message ? `${err.message}: ${cause.message}` : err.message

  return new BeeResponseError(method, url, message)
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
    default: {
      const text = await res.text()
      data = text ? JSON.parse(text) : null
    }
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
