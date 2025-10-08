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
import { Duration } from '../../utils/duration'
import { http } from '../../utils/http'
import { Size } from '../../utils/size'
import { getStampEffectiveBytes, getStampTheoreticalBytes, getStampUsage } from '../../utils/stamps'
import { asNumberString } from '../../utils/type'
import { BatchId, EthAddress } from '../../utils/typed-bytes'
import { normalizeBatchTTL } from '../../utils/workaround'

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

export async function getAllPostageBatches(
  requestOptions: BeeRequestOptions,
  encryption?: boolean,
  erasureCodeLevel?: RedundancyLevel,
): Promise<PostageBatch[]> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const stamps = Types.asArray(body.stamps, { name: 'stamps' }).map(x => Types.asObject(x, { name: 'stamp' }))

  return stamps.map(x => {
    const utilization = Types.asNumber(x.utilization, { name: 'utilization' })
    const depth = Types.asNumber(x.depth, { name: 'depth' })
    const bucketDepth = Types.asNumber(x.bucketDepth, { name: 'bucketDepth' })
    const usage = getStampUsage(utilization, depth, bucketDepth)
    const batchTTL = normalizeBatchTTL(Types.asNumber(x.batchTTL, { name: 'batchTTL' }))
    const duration = Duration.fromSeconds(batchTTL)

    const effectiveBytes = getStampEffectiveBytes(depth, encryption, erasureCodeLevel)

    return {
      batchID: new BatchId(Types.asString(x.batchID, { name: 'batchID' })),
      utilization,
      usable: Types.asBoolean(x.usable, { name: 'usable' }),
      label: Types.asEmptiableString(x.label, { name: 'label' }),
      depth,
      amount: asNumberString(x.amount, { name: 'amount' }),
      bucketDepth,
      blockNumber: Types.asNumber(x.blockNumber, { name: 'blockNumber' }),
      immutableFlag: Types.asBoolean(x.immutableFlag, { name: 'immutableFlag' }),
      usage,
      usageText: `${Math.round(usage * 100)}%`,
      size: Size.fromBytes(effectiveBytes),
      remainingSize: Size.fromBytes(Math.ceil(effectiveBytes * (1 - usage))),
      theoreticalSize: Size.fromBytes(getStampTheoreticalBytes(depth)),
      duration,
    }
  })
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

  const utilization = Types.asNumber(body.utilization, { name: 'utilization' })
  const depth = Types.asNumber(body.depth, { name: 'depth' })
  const bucketDepth = Types.asNumber(body.bucketDepth, { name: 'bucketDepth' })
  const usage = getStampUsage(utilization, depth, bucketDepth)
  const batchTTL = normalizeBatchTTL(Types.asNumber(body.batchTTL, { name: 'batchTTL' }))
  const duration = Duration.fromSeconds(batchTTL)

  const effectiveBytes = getStampEffectiveBytes(depth, encryption, erasureCodeLevel)

  return {
    batchID: new BatchId(Types.asString(body.batchID, { name: 'batchID' })),
    utilization,
    usable: Types.asBoolean(body.usable, { name: 'usable' }),
    label: Types.asEmptiableString(body.label, { name: 'label' }),
    depth,
    amount: asNumberString(body.amount, { name: 'amount' }),
    bucketDepth,
    blockNumber: Types.asNumber(body.blockNumber, { name: 'blockNumber' }),
    immutableFlag: Types.asBoolean(body.immutableFlag, { name: 'immutableFlag' }),
    usage,
    usageText: `${Math.round(usage * 100)}%`,
    size: Size.fromBytes(effectiveBytes),
    remainingSize: Size.fromBytes(Math.ceil(effectiveBytes * (1 - usage))),
    theoreticalSize: Size.fromBytes(getStampTheoreticalBytes(depth)),
    duration,
  }
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
