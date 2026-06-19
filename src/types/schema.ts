import { z } from 'zod'
import { asNumberString } from '../utils/type'

export const GetChainStateResponse = z.object({
  chainTip: z.number(),
  block: z.number(),
  totalAmount: z.string().transform(s => asNumberString(s, { name: 'totalAmount' })),
  currentPrice: z.string().transform(Number),
  minimumValidityBlocks: z.number().optional(),
})
