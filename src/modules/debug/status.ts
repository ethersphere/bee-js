import { Types } from 'cafe-utility'
import getMajorSemver from 'semver/functions/major.js'
import { BeeRequestOptions } from '../../index'
import type { DebugStatus, Health, NodeInfo, Readiness } from '../../types/debug'
import { BeeVersions, toBeeMode } from '../../types/debug'
import { http } from '../../utils/http'

export const SUPPORTED_BEE_VERSION_EXACT = '2.6.0-d0aa8b93'
export const SUPPORTED_BEE_VERSION = SUPPORTED_BEE_VERSION_EXACT.split('-')[0]
export const SUPPORTED_API_VERSION = '7.3.0'

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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    overlay: Types.asString(body.overlay, { name: 'overlay' }),
    proximity: Types.asNumber(body.proximity, { name: 'proximity' }),
    beeMode: toBeeMode(Types.asString(body.beeMode, { name: 'beeMode' })),
    reserveSize: Types.asNumber(body.reserveSize, { name: 'reserveSize' }),
    reserveSizeWithinRadius: Types.asNumber(body.reserveSizeWithinRadius, { name: 'reserveSizeWithinRadius' }),
    pullsyncRate: Types.asNumber(body.pullsyncRate, { name: 'pullsyncRate' }),
    storageRadius: Types.asNumber(body.storageRadius, { name: 'storageRadius' }),
    connectedPeers: Types.asNumber(body.connectedPeers, { name: 'connectedPeers' }),
    neighborhoodSize: Types.asNumber(body.neighborhoodSize, { name: 'neighborhoodSize' }),
    batchCommitment: Types.asNumber(body.batchCommitment, { name: 'batchCommitment' }),
    isReachable: Types.asBoolean(body.isReachable, { name: 'isReachable' }),
    lastSyncedBlock: Types.asNumber(body.lastSyncedBlock, { name: 'lastSyncedBlock' }),
    committedDepth: Types.asNumber(body.committedDepth, { name: 'committedDepth' }),
    isWarmingUp: Types.asBoolean(body.isWarmingUp, { name: 'isWarmingUp' }),
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    apiVersion: Types.asString(body.apiVersion, { name: 'apiVersion' }),
    version: Types.asString(body.version, { name: 'version' }),
    status: Types.asString(body.status, { name: 'status' }) as 'ok',
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    apiVersion: Types.asString(body.apiVersion, { name: 'apiVersion' }),
    version: Types.asString(body.version, { name: 'version' }),
    status: Types.asString(body.status, { name: 'status' }),
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    beeMode: toBeeMode(Types.asString(body.beeMode, { name: 'beeMode' })),
    chequebookEnabled: Types.asBoolean(body.chequebookEnabled, { name: 'chequebookEnabled' }),
    swapEnabled: Types.asBoolean(body.swapEnabled, { name: 'swapEnabled' }),
  }
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
