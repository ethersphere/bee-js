import { StampBatch } from '../types'
import { safeAxios } from '../utils/safeAxios'

const STAMPS_ENDPOINT = '/stamps'

interface GetAllStampsResponse {
  stamps: StampBatch[]
}

interface CreateStampResponse {
  batchID: string
}

export async function getAllStamps(url: string): Promise<StampBatch[]> {
  const response = await safeAxios<GetAllStampsResponse>({
    method: 'get',
    url: url + STAMPS_ENDPOINT,
    responseType: 'json',
  })

  return response.data.stamps
}

export async function getStamp(url: string, batchId: string): Promise<StampBatch> {
  const response = await safeAxios<StampBatch>({
    method: 'get',
    url: `${url}${STAMPS_ENDPOINT}/${batchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function createStamp(url: string, amount: bigint, depth: number, label?: string): Promise<string> {
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
