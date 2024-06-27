import getMajorSemver from 'semver/functions/major.js'
import { BeeRequestOptions } from '../../index'
import type { DebugStatus, Health, NodeInfo } from '../../types/debug'
import { BeeVersions } from '../../types/debug'
import { http } from '../../utils/http'

// Following lines bellow are automatically updated with GitHub Action when Bee version is updated
// so if you are changing anything about them change the `update_bee` action accordingly!
export const SUPPORTED_BEE_VERSION_EXACT = '1.18.2-759f56f'
export const SUPPORTED_API_VERSION = '4.0.0'

export const SUPPORTED_BEE_VERSION = SUPPORTED_BEE_VERSION_EXACT.split('-')[0]

const NODE_INFO_URL = 'node'
const STATUS_URL = 'status'
const HEALTH_URL = 'health'
const READINESS_URL = 'readiness'

export async function getDebugStatus(requestOptions: BeeRequestOptions): Promise<DebugStatus> {
  const response = await http<DebugStatus>(requestOptions, {
    method: 'get',
    url: STATUS_URL,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get health of node
 *
 * @param requestOptions Options for making requests
 */
export async function getHealth(requestOptions: BeeRequestOptions): Promise<Health> {
  const response = await http<Health>(requestOptions, {
    method: 'get',
    url: HEALTH_URL,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get readiness of node
 *
 * @param requestOptions Options for making requests
 */
export async function getReadiness(requestOptions: BeeRequestOptions): Promise<boolean> {
  try {
    const response = await http<void>(requestOptions, {
      method: 'get',
      url: READINESS_URL,
    })

    return response.status === 200
  } catch {
    return false
  }
}

/**
 * Get information about Bee node
 *
 * @param requestOptions Options for making requests
 */
export async function getNodeInfo(requestOptions: BeeRequestOptions): Promise<NodeInfo> {
  const response = await http<NodeInfo>(requestOptions, {
    method: 'get',
    url: NODE_INFO_URL,
    responseType: 'json',
  })

  return response.data
}

/**
 * Connects to a node and checks if it is a supported Bee version by the bee-js
 *
 * @param requestOptions Options for making requests
 * @returns true if the Bee node version is supported
 * @deprecated Use `isSupportedExactVersion` instead
 */
// TODO: Remove on break
export async function isSupportedVersion(requestOptions: BeeRequestOptions): Promise<boolean> {
  return isSupportedExactVersion(requestOptions)
}

/**
 * Connects to a node and checks if its version matches with the one that bee-js supports.
 *
 * Be aware that this is the most strict version check and most probably
 * you will want to use more relaxed API-versions based checks like
 * `isSupportedApiVersion`, `isSupportedMainApiVersion` or `isSupportedDebugApiVersion`
 * based on your use-case.
 *
 * @param requestOptions Options for making requests
 */
export async function isSupportedExactVersion(requestOptions: BeeRequestOptions): Promise<boolean> {
  const { version } = await getHealth(requestOptions)

  return version === SUPPORTED_BEE_VERSION_EXACT
}

/**
 * Connects to a node and checks if its main's API version matches with the one that bee-js supports.
 *
 * This is useful if you are not using `Bee` class (for anything else then this check)
 * and want to make sure about compatibility.
 *
 * @param requestOptions Options for making requests
 */
export async function isSupportedMainApiVersion(requestOptions: BeeRequestOptions): Promise<boolean> {
  const { apiVersion } = await getHealth(requestOptions)

  return getMajorSemver(apiVersion) === getMajorSemver(SUPPORTED_API_VERSION)
}

/**
 * Connects to a node and checks if its Main API versions matches with the one that bee-js supports.
 *
 * This should be the main way how to check compatibility for your app and Bee node.
 *
 * @param requestOptions Options for making requests
 */
export async function isSupportedApiVersion(requestOptions: BeeRequestOptions): Promise<boolean> {
  const { apiVersion } = await getHealth(requestOptions)

  return getMajorSemver(apiVersion) === getMajorSemver(SUPPORTED_API_VERSION)
}

/**
 * Returns object with all versions specified by the connected Bee node (properties prefixed with `bee*`)
 * and versions that bee-js supports (properties prefixed with `supported*`).
 *
 * @param requestOptions Options for making requests
 */
export async function getVersions(requestOptions: BeeRequestOptions): Promise<BeeVersions> {
  const { version, apiVersion } = await getHealth(requestOptions)

  return {
    supportedBeeVersion: SUPPORTED_BEE_VERSION_EXACT,
    supportedBeeApiVersion: SUPPORTED_API_VERSION,
    beeVersion: version,
    beeApiVersion: apiVersion,
  }
}
