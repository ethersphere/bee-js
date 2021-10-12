import { http } from '../../utils/http'
import type { Health } from '../../types/debug'
import { engines } from '../../../package.json'
import { Ky } from '../../types'
export const SUPPORTED_BEE_VERSION_EXACT = engines.bee
export const SUPPORTED_BEE_VERSION = engines.bee.substr(0, engines.bee.indexOf('-'))

/**
 * Get health of node
 *
 * @param ky Ky debug instance
 */
export async function getHealth(ky: Ky): Promise<Health> | never {
  const response = await http<Health>(ky, {
    method: 'get',
    path: `health`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Connnects to a node and checks if it is a supported Bee version by the bee-js
 *
 * @param ky Ky debug instance
 *
 * @returns true if the Bee node version is supported
 */
export async function isSupportedVersion(ky: Ky): Promise<boolean> | never {
  const { version } = await getHealth(ky)

  return version === SUPPORTED_BEE_VERSION_EXACT
}
