import { http } from '../utils/http.js'

import type { Ky } from '../types/index.js'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param ky Ky instance for given Bee class instance
 */
export async function checkConnection(ky: Ky): Promise<void> | never {
  await http<string>(ky, {
    path: '',
  })
}
