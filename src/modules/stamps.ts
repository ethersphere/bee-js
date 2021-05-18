import { Address, StampBatch } from '../types'
import { safeAxios } from '../utils/safeAxios'

const STAMPS_ENDPOINT = '/stamps'

interface GetAllStampsResponse {
  stamps: StampBatch[]
}

interface CreateStampResponse {
  batchID: Address
}

export async function getAllPostageBatches(url: string): Promise<StampBatch[]> {
  const response = await safeAxios<GetAllStampsResponse>({
    method: 'get',
    url: url + STAMPS_ENDPOINT,
    responseType: 'json',
  })

  return response.data.stamps
}

export async function getPostageBatch(url: string, postageBatchId: Address): Promise<StampBatch> {
  const response = await safeAxios<StampBatch>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function createPostageBatch(url: string, amount: bigint, depth: number, label?: string): Promise<Address> {
  const params: Record<string, string> = {}

  if (label) {
    params.label = label
  }

  const response = await safeAxios<CreateStampResponse>({
    method: 'post',
    url: `${url}${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    params,
  })

  return response.data.batchID
}
