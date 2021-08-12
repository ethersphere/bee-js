import { http } from '../utils/http'
import { Ky } from '../types'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param ky Ky instance for given Bee class instance
 */
export async function checkConnection(ky: Ky): Promise<void> | never {
  await http<string>(ky, {
    url: '',
  })
}
