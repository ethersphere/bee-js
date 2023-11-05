import type {
  BatchId,
  BeeRequestOptions,
  NumberString,
  PostageBatch,
  PostageBatchBuckets,
  PostageBatchOptions,
} from '../../types'
import { http } from '../../utils/http'

const STAMPS_ENDPOINT = 'stamps'
const BATCHES_ENDPOINT = 'batches'

interface GetAllStampsResponse {
  stamps: PostageBatch[]
}

interface StampResponse {
  batchID: BatchId
}

export async function getGlobalPostageBatches(requestOptions: BeeRequestOptions): Promise<PostageBatch[]> {
  const response = await http<GetAllStampsResponse>(requestOptions, {
    method: 'get',
    url: `${BATCHES_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps
}

export async function getAllPostageBatches(requestOptions: BeeRequestOptions): Promise<PostageBatch[]> {
  const response = await http<GetAllStampsResponse>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps
}

export async function getPostageBatch(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
): Promise<PostageBatch> {
  const response = await http<PostageBatch>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function getPostageBatchBuckets(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
): Promise<PostageBatchBuckets> {
  const response = await http<PostageBatchBuckets>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}/buckets`,
    responseType: 'json',
  })

  return response.data
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

  const response = await http<StampResponse>(requestOptions, {
    method: 'post',
    url: `${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    params: { label: options?.label },
    headers,
  })

  return response.data.batchID
}

export async function topUpBatch(
  requestOptions: BeeRequestOptions,
  id: string,
  amount: NumberString,
): Promise<BatchId> {
  const response = await http<StampResponse>(requestOptions, {
    method: 'patch',
    url: `${STAMPS_ENDPOINT}/topup/${id}/${amount}`,
    responseType: 'json',
  })

  return response.data.batchID
}

export async function diluteBatch(requestOptions: BeeRequestOptions, id: string, depth: number): Promise<BatchId> {
  const response = await http<StampResponse>(requestOptions, {
    method: 'patch',
    url: `${STAMPS_ENDPOINT}/dilute/${id}/${depth}`,
    responseType: 'json',
  })

  return response.data.batchID
}
