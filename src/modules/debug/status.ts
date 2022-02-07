import { http } from '../../utils/http'
import type { Health, NodeInfo } from '../../types/debug'
import { engines } from '../../../package.json'
import { Ky } from '../../types'

// This line bellow is automatically updated with GitHub Action when Bee version is updated
// so if you are changing anything about it change the `update_bee` action accordingly!
export const SUPPORTED_BEE_VERSION_EXACT = '1.4.2-rc2-2a4574a0-stateful'
export const SUPPORTED_BEE_VERSION = SUPPORTED_BEE_VERSION_EXACT.substring(0, SUPPORTED_BEE_VERSION_EXACT.indexOf('-'))

const NODE_INFO_URL = 'node'
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
export async function getNodeInfo(ky: Ky): Promise<NodeInfo> {
  const response = await http<NodeInfo>(ky, {
    method: 'get',
    path: NODE_INFO_URL,
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
