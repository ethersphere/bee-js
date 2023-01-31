import { http } from '../utils/http'
import type { Options as KyOptions } from 'ky'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param kyOptions Ky instance for given Bee class instance
 */
export async function checkConnection(kyOptions: KyOptions): Promise<void> | never {
  await http<string>(kyOptions, {
    path: '',
  })
}
