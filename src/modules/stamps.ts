import { Address, PostageBatch, PostageBatchOptions } from '../types'
import { safeAxios } from '../utils/safeAxios'

const STAMPS_ENDPOINT = '/stamps'
export const MINIMUM_DEPTH = 16
export const MAXIMUM_DEPTH = 255

interface GetAllStampsResponse {
  stamps: PostageBatch[]
}

interface CreateStampResponse {
  batchID: Address
}

export async function getAllPostageBatches(url: string): Promise<PostageBatch[]> {
  const response = await safeAxios<GetAllStampsResponse>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps
}

export async function getPostageBatch(url: string, postageBatchId: Address): Promise<PostageBatch> {
  const response = await safeAxios<PostageBatch>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function createPostageBatch(
  url: string,
  amount: bigint,
  depth: number,
  options?: PostageBatchOptions,
): Promise<Address> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
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
