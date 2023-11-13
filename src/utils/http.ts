import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Objects, Strings } from 'cafe-utility'
import { BeeRequestOptions } from '../index'

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
  try {
    const requestConfig: AxiosRequestConfig = Objects.deepMerge3(DEFAULT_HTTP_CONFIG, config, options)
    maybeRunOnRequestHook(options, requestConfig)
    const response = await axios(requestConfig)

    return response
  } catch (e) {
    throw e
  }
}

function maybeRunOnRequestHook(options: BeeRequestOptions, requestConfig: AxiosRequestConfig) {
  if (options.onRequest) {
    options.onRequest({
      method: requestConfig.method || 'GET',
      url: Strings.joinUrl(requestConfig.baseURL as string, requestConfig.url as string),
      headers: { ...requestConfig.headers } as Record<string, string>,
      params: requestConfig.params,
    })
  }
}
