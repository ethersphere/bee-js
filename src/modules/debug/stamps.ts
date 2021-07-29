import { BatchId, DebugPostageBatch, NumberString, PostageBatchBuckets, PostageBatchOptions } from '../../types'
import { safeAxios } from '../../utils/safe-axios'

const STAMPS_ENDPOINT = '/stamps'

interface GetAllStampsResponse {
  stamps: DebugPostageBatch[]
}

interface CreateStampResponse {
  batchID: BatchId
}

export async function getAllPostageBatches(url: string): Promise<DebugPostageBatch[]> {
  const response = await safeAxios<GetAllStampsResponse>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps || []
}

export async function getPostageBatch(url: string, postageBatchId: BatchId): Promise<DebugPostageBatch> {
  const response = await safeAxios<DebugPostageBatch>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function getPostageBatchBuckets(url: string, postageBatchId: BatchId): Promise<PostageBatchBuckets> {
  const response = await safeAxios<PostageBatchBuckets>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}/${postageBatchId}/buckets`,
    responseType: 'json',
  })

  return response.data
}

export async function createPostageBatch(
  url: string,
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

  const response = await safeAxios<CreateStampResponse>({
    method: 'post',
    url: `${url}${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    params: { label: options?.label },
    headers,
  })

  return response.data.batchID
}
