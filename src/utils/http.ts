import axios, { AxiosResponse } from 'axios'
import { BeeError, BeeRequestError, BeeResponseError } from './error'
import { Options as KyOptions } from 'ky-universal'

import { Ky } from '../types'
axios.defaults.adapter = require('axios/lib/adapters/http') // https://stackoverflow.com/a/57320262

/**
 * Utility function that sets passed headers to ALL axios calls without distinction of Bee URLs.
 *
 * @param headers
 */
export function setDefaultHeaders(headers: Record<string, string>): void {
  axios.defaults.headers.common = headers
}

export async function http<T>(ky: Ky, url: string, config: KyOptions): Promise<AxiosResponse<T>> {
  try {
    const response = await ky(url, {
      ...config,
    })

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
