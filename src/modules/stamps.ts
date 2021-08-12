import type { BatchId, Ky, NumberString, PostageBatch, PostageBatchOptions } from '../types'
import { http } from '../utils/http'

const STAMPS_ENDPOINT = 'stamps'

interface GetAllStampsResponse {
  stamps: PostageBatch[]
}

interface CreateStampResponse {
  batchID: BatchId
}

export async function getAllPostageBatches(ky: Ky): Promise<PostageBatch[]> {
  const response = await http<GetAllStampsResponse>(ky, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps || []
}

export async function getPostageBatch(ky: Ky, postageBatchId: BatchId): Promise<PostageBatch> {
  const response = await http<PostageBatch>(ky, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}/${postageBatchId}`,
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
