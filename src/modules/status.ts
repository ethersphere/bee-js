import { BeeRequestOptions } from '../index'
import { IsGatewayResponse } from '../types/schema/status'
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

    return IsGatewayResponse.parse(response.data).gateway
  } catch (error) {
    return false
  }
}
