import { http } from '../../utils/http'
import type { Health, NodesInfo } from '../../types/debug'
import { engines } from '../../../package.json'
import { Ky } from '../../types'

export const SUPPORTED_BEE_VERSION_EXACT = engines.bee
export const SUPPORTED_BEE_VERSION = engines.bee.substr(0, engines.bee.indexOf('-'))

const MODES_URL = 'node'
const HEALTH_URL = 'health'

/**
 * Get health of node
 *
 * @param ky Ky debug instance
 */
export async function getHealth(ky: Ky): Promise<Health> {
  const response = await http<Health>(ky, {
    method: 'get',
    path: HEALTH_URL,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get information about Bee node
 *
 * @param ky Ky debug instance
 */
export async function getNodeInfo(ky: Ky): Promise<NodesInfo> {
  const response = await http<NodesInfo>(ky, {
    method: 'get',
    path: MODES_URL,
    responseType: 'json',
  })

  return response.data
}

/**
 * Connects to a node and checks if it is a supported Bee version by the bee-js
 *
 * @param ky Ky debug instance
 *
 * @returns true if the Bee node version is supported
 */
export async function isSupportedVersion(ky: Ky): Promise<boolean> {
  const { version } = await getHealth(ky)

  return version === SUPPORTED_BEE_VERSION_EXACT
}
