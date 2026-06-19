import { z } from 'zod'
import { asNumberString } from '../utils/type'
import { BatchId, EthAddress } from '../utils/typed-bytes'

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

export const GetChainStateResponse = z.object({
  chainTip: z.number(),
  block: z.number(),
  totalAmount: z.string().transform(s => asNumberString(s, { name: 'totalAmount' })),
  currentPrice: z.string().transform(Number),
  minimumValidityBlocks: z.number().optional(),
})
