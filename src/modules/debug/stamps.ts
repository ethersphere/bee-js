import type {
  BeeRequestOptions,
  GlobalPostageBatch,
  NumberString,
  PostageBatch,
  PostageBatchBuckets,
  PostageBatchOptions,
  RedundancyLevel,
} from '../../types'
import {
  BatchIdResponse,
  GetAllPostageBatchesResponse,
  GetGlobalPostageBatchesResponse,
  GetPostageBatchBucketsResponse,
  GetPostageBatchResponse,
} from '../../types/schema/stamps'

import { http } from '../../utils/http'
import { mapPostageBatch } from '../../utils/stamps'
import { BatchId } from '../../utils/typed-bytes'

const STAMPS_ENDPOINT = 'stamps'
const BATCHES_ENDPOINT = 'batches'

export async function getGlobalPostageBatches(requestOptions: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${BATCHES_ENDPOINT}`,
    responseType: 'json',
  })

  return GetGlobalPostageBatchesResponse.parse(response.data).batches
}

export async function getGlobalPostageBatch(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
): Promise<GlobalPostageBatch> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${BATCHES_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return GetGlobalPostageBatchResponse.parse(response.data)
}

export async function getAllPostageBatches(requestOptions: BeeRequestOptions): Promise<PostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return GetAllPostageBatchesResponse.parse(response.data).stamps.map(x => mapPostageBatch(x))
}

export async function getPostageBatch(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  encryption?: boolean,
  erasureCodeLevel?: RedundancyLevel,
): Promise<PostageBatch> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return mapPostageBatch(GetPostageBatchResponse.parse(response.data), encryption, erasureCodeLevel)
}

export async function getPostageBatchBuckets(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
): Promise<PostageBatchBuckets> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}/buckets`,
    responseType: 'json',
  })

  return GetPostageBatchBucketsResponse.parse(response.data)
}

export async function createPostageBatch(
  requestOptions: BeeRequestOptions,
  amount: NumberString,
  depth: number,
  options?: PostageBatchOptions,
): Promise<BatchId> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.immutableFlag !== undefined) {
    headers.immutable = String(options.immutableFlag)
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    params: { label: options?.label },
    headers,
  })

  return BatchIdResponse.parse(response.data).batchID
}

export async function updatePostageBatchLabel(
  requestOptions: BeeRequestOptions,
  id: BatchId,
  label: string,
): Promise<void> {
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
