import type { BatchId, PostageBatch, NumberString, PostageBatchBuckets, PostageBatchOptions } from '../../types'
import { http } from '../../utils/http'
import type { Options as KyOptions } from 'ky'

const STAMPS_ENDPOINT = 'stamps'

interface GetAllStampsResponse {
  stamps: PostageBatch[]
}

interface StampResponse {
  batchID: BatchId
}

export async function getAllPostageBatches(kyOptions: KyOptions): Promise<PostageBatch[]> {
  const response = await http<GetAllStampsResponse>(kyOptions, {
    method: 'get',
    path: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.parseData.stamps
}

export async function getPostageBatch(kyOptions: KyOptions, postageBatchId: BatchId): Promise<PostageBatch> {
  const response = await http<PostageBatch>(kyOptions, {
    method: 'get',
    path: `${STAMPS_ENDPOINT}/${postageBatchId}`,
    responseType: 'json',
  })

  return response.parseData
}

export async function getPostageBatchBuckets(
  kyOptions: KyOptions,
  postageBatchId: BatchId,
): Promise<PostageBatchBuckets> {
  const response = await http<PostageBatchBuckets>(kyOptions, {
    method: 'get',
    path: `${STAMPS_ENDPOINT}/${postageBatchId}/buckets`,
    responseType: 'json',
  })

  return response.parseData
}

export async function createPostageBatch(
  kyOptions: KyOptions,
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

  const response = await http<StampResponse>(kyOptions, {
    method: 'post',
    path: `${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    searchParams: { label: options?.label },
    headers,
  })

  return response.parseData.batchID
}

export async function topUpBatch(kyOptions: KyOptions, id: string, amount: NumberString): Promise<BatchId> {
  const response = await http<StampResponse>(kyOptions, {
    method: 'patch',
    path: `${STAMPS_ENDPOINT}/topup/${id}/${amount}`,
    responseType: 'json',
  })

  return response.parseData.batchID
}

export async function diluteBatch(kyOptions: KyOptions, id: string, depth: number): Promise<BatchId> {
  const response = await http<StampResponse>(kyOptions, {
    method: 'patch',
    path: `${STAMPS_ENDPOINT}/dilute/${id}/${depth}`,
    responseType: 'json',
  })

  return response.parseData.batchID
}
