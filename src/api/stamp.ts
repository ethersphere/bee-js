import type { BeeRequestOptions, NumberString, PostageBatch, PostageBatchBuckets, RedundancyLevel } from '../types'
import {
  BatchIdResponse,
  GetAllPostageBatchesResponse,
  GetPostageBatchBucketsResponse,
  GetPostageBatchResponse,
} from '../types/schema/stamps'
import { http } from '../utils/http'
import { mapPostageBatch } from '../utils/stamps'
import { BatchId } from '../utils/typed-bytes'

const STAMPS_ENDPOINT = 'stamps'

/**
 * Raw HTTP calls for the `/stamps` endpoint.
 */

export async function createPostageBatch(
  requestOptions: BeeRequestOptions,
  amount: NumberString,
  depth: number,
  label?: string,
  gasPrice?: string,
  immutableFlag?: boolean,
): Promise<BatchId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  if (immutableFlag !== undefined) {
    headers.immutable = String(immutableFlag)
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    params: { label },
    headers,
  })

  return BatchIdResponse.parse(response.data).batchID
}

export async function updateLabel(requestOptions: BeeRequestOptions, id: BatchId, label: string): Promise<void> {
  await http<unknown>(requestOptions, {
    method: 'patch',
    url: `${STAMPS_ENDPOINT}/${id}`,
    responseType: 'json',
    data: { label },
  })
}

export async function topUpBatch(
  requestOptions: BeeRequestOptions,
  id: BatchId,
  amount: NumberString,
): Promise<BatchId> {
  const response = await http<unknown>(requestOptions, {
    method: 'patch',
    url: `${STAMPS_ENDPOINT}/topup/${id}/${amount}`,
    responseType: 'json',
  })

  return BatchIdResponse.parse(response.data).batchID
}

export async function diluteBatch(requestOptions: BeeRequestOptions, id: BatchId, depth: number): Promise<BatchId> {
  const response = await http<unknown>(requestOptions, {
    method: 'patch',
    url: `${STAMPS_ENDPOINT}/dilute/${id}/${depth}`,
    responseType: 'json',
  })

  return BatchIdResponse.parse(response.data).batchID
}

export async function getPostageBatch(
  requestOptions: BeeRequestOptions,
  id: BatchId,
  encryption?: boolean,
  erasureCodeLevel?: RedundancyLevel,
): Promise<PostageBatch> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${id}`,
    responseType: 'json',
  })

  return mapPostageBatch(GetPostageBatchResponse.parse(response.data), encryption, erasureCodeLevel)
}

export async function getPostageBatchBuckets(
  requestOptions: BeeRequestOptions,
  id: BatchId,
): Promise<PostageBatchBuckets> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${id}/buckets`,
    responseType: 'json',
  })

  return GetPostageBatchBucketsResponse.parse(response.data)
}

export async function getAllPostageBatches(requestOptions: BeeRequestOptions): Promise<PostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: STAMPS_ENDPOINT,
    responseType: 'json',
  })

  return GetAllPostageBatchesResponse.parse(response.data).stamps.map(x => mapPostageBatch(x))
}
