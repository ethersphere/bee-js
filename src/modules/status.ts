import { BeeRequestOptions } from '../index'
import { http } from '../utils/http'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param requestOptions Options for making requests
 */
export async function checkConnection(requestOptions: BeeRequestOptions): Promise<void> | never {
  await http<string>(requestOptions, {
    url: '',
  })
}
