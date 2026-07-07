import getMajorSemver from 'semver/functions/major.js'
import { BeeRequestOptions } from '../../index'
import type { DebugStatus, Health, NodeInfo, Readiness } from '../../types/debug'
import { BeeVersions } from '../../types/debug'
import {
  GetDebugStatusResponse,
  GetHealthResponse,
  GetNodeInfoResponse,
  GetReadinessResponse,
} from '../../types/schema/status'
import { http } from '../../utils/http'

export const SUPPORTED_BEE_VERSION_EXACT = '2.8.1-7cf53193'
export const SUPPORTED_BEE_VERSION = SUPPORTED_BEE_VERSION_EXACT.split('-')[0]
export const SUPPORTED_API_VERSION = '8.1.0'

const NODE_INFO_URL = 'node'
const STATUS_URL = 'status'
const HEALTH_URL = 'health'
const READINESS_URL = 'readiness'

export async function getDebugStatus(requestOptions: BeeRequestOptions): Promise<DebugStatus> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: STATUS_URL,
    responseType: 'json',
  })

  return GetDebugStatusResponse.parse(response.data)
}

/**
 * Get health of node
 *
 * @param requestOptions Options for making requests
 */
export async function getHealth(requestOptions: BeeRequestOptions): Promise<Health> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: HEALTH_URL,
    responseType: 'json',
  })

  return GetHealthResponse.parse(response.data)
}

/**
 * Get readiness of node
 *
 * @param requestOptions Options for making requests
 */
export async function getReadiness(requestOptions: BeeRequestOptions): Promise<Readiness> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: READINESS_URL,
  })

  return GetReadinessResponse.parse(response.data)
}

/**
 * Get information about Bee node
 *
 * @param requestOptions Options for making requests
 */
export async function getNodeInfo(requestOptions: BeeRequestOptions): Promise<NodeInfo> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: NODE_INFO_URL,
    responseType: 'json',
  })

  return GetNodeInfoResponse.parse(response.data)
}

/**
 * Connects to a node and checks if its version matches with the one that bee-js supports.
 *
 * This is the most strict version check and most probably you will
 * want to use the relaxed API-versions check `isSupportedApiVersion`.
 *
 * @param requestOptions Options for making requests
 */
export async function isSupportedExactVersion(requestOptions: BeeRequestOptions): Promise<boolean> {
  const { version } = await getHealth(requestOptions)

  return version === SUPPORTED_BEE_VERSION_EXACT
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
