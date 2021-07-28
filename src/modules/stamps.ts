import { BatchId, NumberString, PostageBatch, PostageBatchOptions } from '../types'
import { http } from '../utils/http'

const STAMPS_ENDPOINT = '/stamps'

interface GetAllStampsResponse {
  stamps: PostageBatch[]
}

interface CreateStampResponse {
  batchID: BatchId
}

export async function getAllPostageBatches(ky: Ky): Promise<PostageBatch[]> {
  const response = await http<GetAllStampsResponse>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps || []
}

export async function getPostageBatch(ky: Ky, postageBatchId: BatchId): Promise<PostageBatch> {
  const response = await http<PostageBatch>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}/${postageBatchId}`,
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

  const response = await http<CreateStampResponse>({
    method: 'post',
    url: `${url}${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    params: { label: options?.label },
    headers,
  })

  return response.data.batchID
}
