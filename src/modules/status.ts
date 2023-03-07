import { BeeRequestOptions } from '../index'
import { http } from '../utils/http'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param kyOptions Ky instance for given Bee class instance
 */
export async function checkConnection(requestOptions: BeeRequestOptions): Promise<void> | never {
  await http<string>(requestOptions, {
    url: '',
  })
}
