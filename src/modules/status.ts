import getMajorSemver from 'semver/functions/major.js'
import type { BeeRequestOptions, ChainState, ReserveState } from '../types'
import type { BeeVersions, DebugStatus, Health, NodeInfo, Readiness } from '../types/debug'
import {
  GetDebugStatusResponse,
  GetHealthResponse,
  GetNodeInfoResponse,
  GetReadinessResponse,
} from '../types/schema/status'
import { GetChainStateResponse, GetReserveStateResponse } from '../types/schema/states'
import { http } from '../utils/http'
import type { BeeContext } from './context'

export const SUPPORTED_BEE_VERSION_EXACT = '2.8.1-7cf53193'
export const SUPPORTED_BEE_VERSION = SUPPORTED_BEE_VERSION_EXACT.split('-')[0]
export const SUPPORTED_API_VERSION = '8.1.0'

const NODE_INFO_URL = 'node'
const STATUS_URL = 'status'
const HEALTH_URL = 'health'
const READINESS_URL = 'readiness'
const RESERVE_STATE_ENDPOINT = 'reservestate'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Node status, health, version and chain/reserve state operations.
 *
 * Accessed as `bee.status`.
 */
export class Status {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets the general status of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(requestOptions?: BeeRequestOptions): Promise<DebugStatus> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: STATUS_URL,
      responseType: 'json',
    })

    return GetDebugStatusResponse.parse(response.data)
  }

  /**
   * Gets the health of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getHealth(requestOptions?: BeeRequestOptions): Promise<Health> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: HEALTH_URL,
      responseType: 'json',
    })

    return GetHealthResponse.parse(response.data)
  }

  /**
   * Gets the readiness status of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getReadiness(requestOptions?: BeeRequestOptions): Promise<Readiness> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: READINESS_URL,
    })

    return GetReadinessResponse.parse(response.data)
  }

  /**
   * Gets mode information of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getNodeInfo(requestOptions?: BeeRequestOptions): Promise<NodeInfo> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: NODE_INFO_URL,
      responseType: 'json',
    })

    return GetNodeInfoResponse.parse(response.data)
  }

  /**
   * Connects to a node and checks if its version matches with the one that bee-js supports.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isSupportedExactVersion(requestOptions?: BeeRequestOptions): Promise<boolean> {
    const { version } = await this.getHealth(requestOptions)

    return version === SUPPORTED_BEE_VERSION_EXACT
  }

  /**
   * Connects to a node and checks if its Main API version matches with the one that bee-js supports.
   *
   * This should be the main way how to check compatibility for your app and Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isSupportedApiVersion(requestOptions?: BeeRequestOptions): Promise<boolean> {
    const { apiVersion } = await this.getHealth(requestOptions)

    return getMajorSemver(apiVersion) === getMajorSemver(SUPPORTED_API_VERSION)
  }

  /**
   * Returns object with all versions specified by the connected Bee node (properties prefixed with `bee*`)
   * and versions that bee-js supports (properties prefixed with `supported*`).
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getVersions(requestOptions?: BeeRequestOptions): Promise<BeeVersions> {
    const { version, apiVersion } = await this.getHealth(requestOptions)

    return {
      supportedBeeVersion: SUPPORTED_BEE_VERSION_EXACT,
      supportedBeeApiVersion: SUPPORTED_API_VERSION,
      beeVersion: version,
      beeApiVersion: apiVersion,
    }
  }

  /**
   * Gets reserve state.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getReserveState(requestOptions?: BeeRequestOptions): Promise<ReserveState> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: RESERVE_STATE_ENDPOINT,
      responseType: 'json',
    })

    return GetReserveStateResponse.parse(response.data)
  }

  /**
   * Gets chain state.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChainState(requestOptions?: BeeRequestOptions): Promise<ChainState> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: CHAIN_STATE_ENDPOINT,
      responseType: 'json',
    })

    return GetChainStateResponse.parse(response.data)
  }
}
