import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Dates, Objects, Strings, System } from 'cafe-utility'
import _debug from 'debug'
import { BeeRequestOptions, BeeResponseError } from '../index'

const debug = _debug('bee-js:http')

const { AxiosError } = axios

const MAX_FAILED_ATTEMPTS = 100_000
const DELAY_FAST = 200
const DELAY_SLOW = 1000
const DELAY_THRESHOLD = Dates.minutes(1) / DELAY_FAST

export const DEFAULT_HTTP_CONFIG: AxiosRequestConfig = {
  headers: {
    accept: 'application/json, text/plain, */*',
  },
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
}

/**
 * Main function to make HTTP requests.
 * @param options User defined settings
 * @param config Internal settings and/or Bee settings
 */
export async function http<T>(options: BeeRequestOptions, config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const requestConfig: AxiosRequestConfig = Objects.deepMerge3(DEFAULT_HTTP_CONFIG, config, options)

  if (options.signal) {
    requestConfig.signal = options.signal

    if (options.signal.aborted) {
      throw new BeeResponseError(
        config.method || 'get',
        config.url || '<unknown>',
        'Request aborted',
        undefined,
        undefined,
        'ERR_CANCELED',
      )
    }
  }

  if (requestConfig.data && typeof Buffer !== 'undefined' && Buffer.isBuffer(requestConfig.data)) {
    requestConfig.data = requestConfig.data.buffer.slice(
      requestConfig.data.byteOffset,
      requestConfig.data.byteOffset + requestConfig.data.byteLength,
    )
  }

  if (requestConfig.params) {
    const keys = Object.keys(requestConfig.params)
    for (const key of keys) {
      const value = requestConfig.params[key]

      if (value === undefined) {
        delete requestConfig.params[key]
      }
    }
  }

  let failedAttempts = 0
  while (failedAttempts < MAX_FAILED_ATTEMPTS) {
    if (options.signal?.aborted) {
      throw new BeeResponseError(
        config.method || 'get',
        config.url || '<unknown>',
        'Request aborted',
        undefined,
        undefined,
        'ERR_CANCELED',
      )
    }

    try {
      debug(
        `${requestConfig.method || 'get'} ${Strings.joinUrl([
          requestConfig.baseURL as string,
          requestConfig.url as string,
        ])}`,
        { headers: { ...requestConfig.headers } as Record<string, string>, params: requestConfig.params },
      )
      maybeRunOnRequestHook(options, requestConfig)
      const response = await axios(requestConfig)

      return response as AxiosResponse<T>
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        if (e.code === 'ERR_CANCELED') {
          throw new BeeResponseError(
            config.method || 'get',
            config.url || '<unknown>',
            'Request aborted',
            e.response?.data,
            e.response?.status,
            'ERR_CANCELED',
          )
        }

        if (e.code === 'ECONNABORTED' && options.endlesslyRetry) {
          failedAttempts++
          await System.sleepMillis(failedAttempts < DELAY_THRESHOLD ? DELAY_FAST : DELAY_SLOW)
        } else {
          throw new BeeResponseError(
            config.method || 'get',
            config.url || '<unknown>',
            e.message,
            e.response?.data,
            e.response?.status,
            e.code,
          )
        }
      } else {
        throw e
      }
    }
  }
  throw Error('Max number of failed attempts reached')
}

function maybeRunOnRequestHook(options: BeeRequestOptions, requestConfig: AxiosRequestConfig) {
  if (options.onRequest) {
    options.onRequest({
      method: requestConfig.method || 'GET',
      url: Strings.joinUrl([requestConfig.baseURL as string, requestConfig.url as string]),
      headers: { ...requestConfig.headers } as Record<string, string>,
      params: requestConfig.params,
    })
  }
}
