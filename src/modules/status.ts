import { Types } from 'cafe-utility'
import { BeeRequestOptions } from '../index'
import { http } from '../utils/http'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param requestOptions Options for making requests
 */
export async function checkConnection(requestOptions: BeeRequestOptions): Promise<void> | never {
  await http<unknown>(requestOptions, {
    url: '',
  })
}

export async function isGateway(requestOptions: BeeRequestOptions): Promise<boolean> {
  try {
    const response = await http<unknown>(requestOptions, {
      url: '/gateway',
    })
    const data = Types.asObject(response.data)
    return Types.asBoolean(data.gateway)
  } catch (error) {
    return false
  }
}
