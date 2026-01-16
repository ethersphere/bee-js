import { Types } from 'cafe-utility'
import type {
  BeeRequestOptions,
  GlobalPostageBatch,
  NumberString,
  PostageBatch,
  PostageBatchBuckets,
  PostageBatchOptions,
  RedundancyLevel,
} from '../../types'
import { http } from '../../utils/http'
import { mapPostageBatch, RawPostageBatch } from '../../utils/stamps'
import { asNumberString } from '../../utils/type'
import { BatchId, EthAddress } from '../../utils/typed-bytes'

const STAMPS_ENDPOINT = 'stamps'
const BATCHES_ENDPOINT = 'batches'

export async function getGlobalPostageBatches(requestOptions: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${BATCHES_ENDPOINT}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const batches = Types.asArray(body.batches, { name: 'batches' }).map(x => Types.asObject(x, { name: 'batch' }))

  return batches.map(x => ({
    batchID: new BatchId(Types.asString(x.batchID, { name: 'batchID' })),
    batchTTL: Types.asNumber(x.batchTTL, { name: 'batchTTL' }),
    bucketDepth: Types.asNumber(x.bucketDepth, { name: 'bucketDepth' }),
    depth: Types.asNumber(x.depth, { name: 'depth' }),
    immutable: Types.asBoolean(x.immutable, { name: 'immutable' }),
    owner: new EthAddress(Types.asString(x.owner, { name: 'owner' })),
    start: Types.asNumber(x.start, { name: 'start' }),
    value: asNumberString(x.value, { name: 'value' }),
  }))
}

export async function getAllPostageBatches(requestOptions: BeeRequestOptions): Promise<PostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const stamps = Types.asArray(body.stamps, { name: 'stamps' }).map(x => Types.asObject(x, { name: 'stamp' }))

  return stamps.map(x => mapPostageBatch(validateRawPostageBatch(x)))
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return mapPostageBatch(validateRawPostageBatch(body), encryption, erasureCodeLevel)
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    depth: Types.asNumber(body.depth, { name: 'depth' }),
    bucketDepth: Types.asNumber(body.bucketDepth, { name: 'bucketDepth' }),
    bucketUpperBound: Types.asNumber(body.bucketUpperBound, { name: 'bucketUpperBound' }),
    buckets: Types.asArray(body.buckets, { name: 'buckets' })
      .map(x => Types.asObject(x, { name: 'bucket' }))
      .map(x => ({
        bucketID: Types.asNumber(x.bucketID, { name: 'bucketID' }),
        collisions: Types.asNumber(x.collisions, { name: 'collisions' }),
      })),
  }
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new BatchId(Types.asString(body.batchID, { name: 'batchID' }))
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new BatchId(Types.asString(body.batchID, { name: 'batchID' }))
}

export async function diluteBatch(requestOptions: BeeRequestOptions, id: BatchId, depth: number): Promise<BatchId> {
  const response = await http<unknown>(requestOptions, {
    method: 'patch',
    url: `${STAMPS_ENDPOINT}/dilute/${id}/${depth}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new BatchId(Types.asString(body.batchID, { name: 'batchID' }))
}

function validateRawPostageBatch(raw: Record<string, unknown>): RawPostageBatch {
  return {
    amount: asNumberString(raw.amount, { name: 'amount' }),
    batchID: Types.asString(raw.batchID, { name: 'batchID' }),
    batchTTL: Types.asNumber(raw.batchTTL, { name: 'batchTTL' }),
    bucketDepth: Types.asNumber(raw.bucketDepth, { name: 'bucketDepth' }),
    blockNumber: Types.asNumber(raw.blockNumber, { name: 'blockNumber' }),
    depth: Types.asNumber(raw.depth, { name: 'depth' }),
    immutableFlag: Types.asBoolean(raw.immutableFlag, { name: 'immutableFlag' }),
    label: Types.asEmptiableString(raw.label, { name: 'label' }),
    usable: Types.asBoolean(raw.usable, { name: 'usable' }),
    utilization: Types.asNumber(raw.utilization, { name: 'utilization' }),
  }
}
