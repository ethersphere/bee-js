import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BeeError, BeeRequestError, BeeResponseError } from './error'

axios.defaults.adapter = require('axios/lib/adapters/http') // https://stackoverflow.com/a/57320262

export async function safeAxios<T> (config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    const response = await axios(config)
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
