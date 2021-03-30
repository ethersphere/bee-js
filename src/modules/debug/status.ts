import { safeAxios } from '../../utils/safeAxios'
import type { Health } from '../../types/debug'
import { SUPPORTED_BEE_VERSIONS } from '../../constants'

/**
 * Get health of node
 *
 * @param url Bee debug URL
 */
export async function getHealth(url: string): Promise<Health> | never {
  const response = await safeAxios<Health>({
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
export async function isSupportedVersion(url: string): Promise<boolean> | never {
  const { version } = await getHealth(url)

  // The versions normally look like 0.5.3-c423a39c, this strips the commit hash
  const versionWithoutCommitHash = version.substring(0, version.indexOf('-'))

  return SUPPORTED_BEE_VERSIONS.includes(versionWithoutCommitHash)
}
