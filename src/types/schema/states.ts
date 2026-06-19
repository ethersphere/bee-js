import { z } from 'zod'
import { asNumberString } from '../../utils/type'
import { normalizeCurrentPrice } from '../../utils/workaround'

export const GetReserveStateResponse = z.object({
  commitment: z.number(),
  radius: z.number(),
  storageRadius: z.number(),
  reserveCapacityDoubling: z.number(),
})

export const GetChainStateResponse = z.object({
  block: z.number(),
  chainTip: z.number(),
  totalAmount: z.string().transform(s => asNumberString(s, { name: 'totalAmount' })),
  currentPrice: z
    .string()
    .transform(Number)
    .transform(s => normalizeCurrentPrice(s)),
  minimumValidityBlocks: z.number().optional(),
})
