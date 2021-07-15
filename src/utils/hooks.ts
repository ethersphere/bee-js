import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BeeRequest, BeeResponse, HttpMethod } from '../types'

type HookCallback<V> = (value: V) => V | Promise<V>

function wrapRequest(request: AxiosRequestConfig): BeeRequest {
  let headers = request.headers

  if (headers.common && headers.get && headers.delete && headers.post && headers.patch) {
    headers = Object.assign({}, request.headers.common ?? {}, request.headers[request.method as HttpMethod] ?? {})
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

export function onRequest(cb: HookCallback<BeeRequest>): number {
  return axios.interceptors.request.use(wrapRequestClosure(cb))
}

export function clearOnRequest(id: number): void {
  axios.interceptors.request.eject(id)
}

export function onResponse(cb: HookCallback<BeeResponse>): number {
  return axios.interceptors.response.use(wrapResponseClosure(cb))
}

export function clearOnResponse(id: number): void {
  axios.interceptors.response.eject(id)
}
