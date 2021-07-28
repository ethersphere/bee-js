import { http } from '../../utils/http'
import type { Health } from '../../types/debug'
import { engines } from '../../../package.json'
export const SUPPORTED_BEE_VERSION_EXACT = engines.bee
export const SUPPORTED_BEE_VERSION = engines.bee.substr(0, engines.bee.indexOf('-'))

/**
 * Get health of node
 *
 * @param url Bee debug URL
 */
export async function getHealth(ky: Ky): Promise<Health> | never {
  const response = await http<Health>({
    method: 'get',
    url: `${url}/health`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Connnects to a node and checks if it is a supported Bee version by the bee-js
 *
 * @param url Bee debug URL
 *
 * @returns true if the Bee node version is supported
 */
export async function isSupportedVersion(ky: Ky): Promise<boolean> | never {
  const { version } = await getHealth(url)

  return version === SUPPORTED_BEE_VERSION_EXACT
}
