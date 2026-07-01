import { z } from 'zod'
import { asNumberString } from '../../utils/type'
import { BatchId, EthAddress } from '../../utils/typed-bytes'

export const RawPostageBatchSchema = z.object({
  batchID: z.string(),
  utilization: z.number(),
  utilizationRatio: z.number().optional(),
  usable: z.boolean(),
  label: z.string(),
  depth: z.number(),
  amount: z.string(),
  bucketDepth: z.number(),
  blockNumber: z.number(),
  immutableFlag: z.boolean(),
  batchTTL: z.number(),
})

export const GetGlobalPostageBatchResponse = z.object({
  batchID: z.string().transform(s => new BatchId(s)),
  batchTTL: z.number(),
  bucketDepth: z.number(),
  depth: z.number(),
  immutable: z.boolean(),
  owner: z.string().transform(s => new EthAddress(s)),
  start: z.number(),
  value: z.string().transform(s => asNumberString(s, { name: 'value' })),
})

export const GetGlobalPostageBatchesResponse = z.object({
  batches: z.array(GetGlobalPostageBatchResponse),
})

export const GetAllPostageBatchesResponse = z.object({
  stamps: z.array(RawPostageBatchSchema),
})

export const GetPostageBatchResponse = RawPostageBatchSchema

export const GetPostageBatchBucketsResponse = z.object({
  depth: z.number(),
  bucketDepth: z.number(),
  bucketUpperBound: z.number(),
  buckets: z.array(
    z.object({
      bucketID: z.number(),
      collisions: z.number(),
    }),
  ),
})

export const BatchIdResponse = z.object({
  batchID: z.string().transform(s => new BatchId(s)),
})
