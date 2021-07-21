import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BeeRequest, BeeResponse, HttpMethod } from '../types'

type HookCallback<V> = (value: V) => V | Promise<V>

function wrapRequest(request: AxiosRequestConfig): BeeRequest {
  let headers = request.headers

  // For request interceptor, axios returns also default headers in the object that needs to be joined based on HTTP method
  // and the default headers removed
  if (headers.common && headers.get && headers.delete && headers.post && headers.patch) {
    // Filters out the default headers properties
    const { common: _1, get: _2, delete: _3, post: _4, patch: _5, head: _6, put: _7, ...rest } = headers

    headers = Object.assign({}, request.headers.common ?? {}, request.headers[request.method as HttpMethod] ?? {}, rest)
  }

  return {
    url: `${request.url}`,
    method: request.method as HttpMethod,
    params: request.params,
    headers,
    data: request.data,
  }
}

function wrapRequestClosure(
  cb: HookCallback<BeeRequest>,
): (request: AxiosRequestConfig) => Promise<AxiosRequestConfig> {
  return async (request: AxiosRequestConfig) => {
    await cb(wrapRequest(request))

    return request
  }
}

function wrapResponseClosure(cb: HookCallback<BeeResponse>): (response: AxiosResponse) => Promise<AxiosResponse> {
  return async (response: AxiosResponse) => {
    await cb({
      headers: response.headers,
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      request: wrapRequest(response.config),
    })

    return response
  }
}

/**
 * Function that registers listener callback for all outgoing HTTP requests that bee-js makes.
 *
 * **Be Aware! This listener listens to all Bee/BeeDebug class instances without differentiation!**
 *
 * @param cb
 * @returns ID of the listener that can be used to stop the callback to receive new requests
 */
export function onRequest(cb: HookCallback<BeeRequest>): number {
  return axios.interceptors.request.use(wrapRequestClosure(cb))
}

/**
 * Function that stops forwarding new requests to associated listener callback
 * @param id ID that onRequest returned
 */
export function clearOnRequest(id: number): void {
  axios.interceptors.request.eject(id)
}

/**
 * Function that registers listener callback for all incoming HTTP responses that bee-js made.
 *
 * **Be Aware! This listener listens to all Bee/BeeDebug class instances without differentiation!**
 *
 * @param cb
 * @returns ID of the listener that can be used to stop the callback to receive new responses
 */
export function onResponse(cb: HookCallback<BeeResponse>): number {
  return axios.interceptors.response.use(wrapResponseClosure(cb))
}

/**
 * Function that stops forwarding new responses to associated listener callback
 * @param id ID that onResponse returned
 */
export function clearOnResponse(id: number): void {
  axios.interceptors.response.eject(id)
}
