import type { BeeRequestOptions, GlobalPostageBatch } from '../types'
import { GetGlobalPostageBatchResponse, GetGlobalPostageBatchesResponse } from '../types/schema/stamps'
import { http } from '../utils/http'
import { BatchId } from '../utils/typed-bytes'

const batchesEndpoint = 'batches'

/**
 * Raw HTTP calls for the `/batches` endpoint.
 */

export async function getGlobalPostageBatch(
  requestOptions: BeeRequestOptions,
  id: BatchId,
): Promise<GlobalPostageBatch> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${batchesEndpoint}/${id}`,
    responseType: 'json',
  })

  return GetGlobalPostageBatchResponse.parse(response.data)
}

export async function getAllGlobalPostageBatches(requestOptions: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: batchesEndpoint,
    responseType: 'json',
  })

  return GetGlobalPostageBatchesResponse.parse(response.data).batches
}
