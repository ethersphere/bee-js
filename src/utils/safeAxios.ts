import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BeeError, BeeRequestError, BeeResponseError } from './error'
import JsonBig from 'json-bigint'

import utils from 'axios/lib/utils'
import normalizeHeaderName from 'axios/lib/helpers/normalizeHeaderName'
axios.defaults.adapter = require('axios/lib/adapters/http') // https://stackoverflow.com/a/57320262

/**
 * Utility function from axios's implementation
 * https://github.com/axios/axios/blob/d99d5faac29899eba68ce671e6b3cbc9832e9ad8/lib/defaults.js
 *
 * @param headers
 * @param value
 */
function setContentTypeIfUnset(headers: Record<string, unknown>, value: string) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value
  }
}

/**
 * Taken over from axios's implementation
 * https://github.com/axios/axios/blob/d99d5faac29899eba68ce671e6b3cbc9832e9ad8/lib/defaults.js
 *
 * Unfortunately we can't use the default implementation as fallback one and override only the JSON serialization as the JSON.stringify
 * is a last thing to do as all the previous cases (buffer, file etc.) are objects as well
 * so they have to be ruled out first before trying JSON.stringify.
 *
 * @param data
 * @param headers
 */
function jsonBigTransformRequest(data: unknown, headers: Record<string, unknown>): string | unknown {
  normalizeHeaderName(headers, 'Accept')
  normalizeHeaderName(headers, 'Content-Type')

  if (
    utils.isFormData(data) ||
    utils.isArrayBuffer(data) ||
    utils.isBuffer(data) ||
    utils.isStream(data) ||
    utils.isFile(data) ||
    utils.isBlob(data)
  ) {
    return data
  }

  if (utils.isArrayBufferView(data)) {
    return data.buffer
  }

  if (utils.isURLSearchParams(data)) {
    setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8')

    return data.toString()
  }

  if (utils.isObject(data)) {
    setContentTypeIfUnset(headers, 'application/json;charset=utf-8')
    const JsonBigNative = JsonBig({ useNativeBigInt: true })

    return JsonBigNative.stringify(data)
  }

  return data
}

function jsonBigTransformResponse(forceBigInt = false) {
  return (data: unknown): unknown => {
    if (typeof data === 'string') {
      const JsonBigNative = JsonBig({ useNativeBigInt: true, alwaysParseAsBig: forceBigInt })

      try {
        data = JsonBigNative.parse(data)
      } catch (e) {
        /* Ignore */
      }
    }

    return data
  }
}

export async function safeAxios<T>(config: AxiosRequestConfig & { forceBigInt?: boolean }): Promise<AxiosResponse<T>> {
  try {
    const response = await axios({
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      transformRequest: jsonBigTransformRequest,
      transformResponse: jsonBigTransformResponse(config.forceBigInt),
      ...config,
    })

    return response
  } catch (e) {
    if (e.response) {
      throw new BeeResponseError(e.response.status, e.response.statusText)
    } else if (e.request) {
      throw new BeeRequestError(e.message)
    } else {
      throw new BeeError(e.message)
    }
  }
}
