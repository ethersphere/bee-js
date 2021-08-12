import type {
  BatchId,
  DebugPostageBatch,
  Ky,
  NumberString,
  PostageBatchBuckets,
  PostageBatchOptions,
} from '../../types'
import { http } from '../../utils/http'

const STAMPS_ENDPOINT = 'stamps'

interface GetAllStampsResponse {
  stamps: DebugPostageBatch[]
}

interface CreateStampResponse {
  batchID: BatchId
}

export async function getAllPostageBatches(ky: Ky): Promise<DebugPostageBatch[]> {
  const response = await http<GetAllStampsResponse>(ky, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps || []
}

export async function getPostageBatch(ky: Ky, postageBatchId: BatchId): Promise<DebugPostageBatch> {
  const response = await http<DebugPostageBatch>(ky, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function getPostageBatchBuckets(ky: Ky, postageBatchId: BatchId): Promise<PostageBatchBuckets> {
  const response = await http<PostageBatchBuckets>(ky, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}/buckets`,
    responseType: 'json',
  })

  return response.data
}

export async function createPostageBatch(
  ky: Ky,
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

  const response = await http<CreateStampResponse>(ky, {
    method: 'post',
    url: `${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    searchParams: { label: options?.label },
    headers,
  })

  return response.data.batchID
}
