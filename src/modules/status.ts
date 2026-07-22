import getMajorSemver from 'semver/functions/major.js'
import type { BeeRequestOptions, ChainState, ReserveState } from '../types'
import type { BeeVersions, DebugStatus, Health, NodeInfo, Readiness } from '../types/debug'
import { SUPPORTED_API_VERSION, SUPPORTED_BEE_VERSION_EXACT } from '../version'
import * as api from '../api/status'
import type { BeeContext } from './context'

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
    return api.getDebugStatus(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the health of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getHealth(requestOptions?: BeeRequestOptions): Promise<Health> {
    return api.getHealth(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the readiness status of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getReadiness(requestOptions?: BeeRequestOptions): Promise<Readiness> {
    return api.getReadiness(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets mode information of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getNodeInfo(requestOptions?: BeeRequestOptions): Promise<NodeInfo> {
    return api.getNodeInfo(this.context.getRequestOptionsForCall(requestOptions))
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
    return api.getReserveState(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets chain state.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChainState(requestOptions?: BeeRequestOptions): Promise<ChainState> {
    return api.getChainState(this.context.getRequestOptionsForCall(requestOptions))
  }
}
