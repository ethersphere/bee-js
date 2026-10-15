import type { BeeRequestOptions, ChainState, ReserveState } from '../types'
import type { DebugStatus, Health, NodeInfo, Readiness } from '../types/debug'
import {
  GetDebugStatusResponse,
  GetHealthResponse,
  GetNodeInfoResponse,
  GetReadinessResponse,
} from '../types/schema/status'
import { GetChainStateResponse, GetReserveStateResponse } from '../types/schema/states'
import { http } from '../utils/http'

const NODE_INFO_URL = 'node'
const STATUS_URL = 'status'
const HEALTH_URL = 'health'
const READINESS_URL = 'readiness'
const RESERVE_STATE_ENDPOINT = 'reservestate'
const CHAIN_STATE_ENDPOINT = 'chainstate'

/**
 * Raw HTTP calls for the node status, health, version and chain/reserve state endpoints.
 */

export async function getDebugStatus(requestOptions: BeeRequestOptions): Promise<DebugStatus> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: STATUS_URL,
    responseType: 'json',
  })

  return GetDebugStatusResponse.parse(response.data)
}

export async function getHealth(requestOptions: BeeRequestOptions): Promise<Health> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: HEALTH_URL,
    responseType: 'json',
  })

  return GetHealthResponse.parse(response.data)
}

export async function getReadiness(requestOptions: BeeRequestOptions): Promise<Readiness> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: READINESS_URL,
  })

  return GetReadinessResponse.parse(response.data)
}

export async function getNodeInfo(requestOptions: BeeRequestOptions): Promise<NodeInfo> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: NODE_INFO_URL,
    responseType: 'json',
  })

  return GetNodeInfoResponse.parse(response.data)
}

export async function getReserveState(requestOptions: BeeRequestOptions): Promise<ReserveState> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: RESERVE_STATE_ENDPOINT,
    responseType: 'json',
  })

  return GetReserveStateResponse.parse(response.data)
}

export async function getChainState(requestOptions: BeeRequestOptions): Promise<ChainState> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: CHAIN_STATE_ENDPOINT,
    responseType: 'json',
  })

  return GetChainStateResponse.parse(response.data)
}
