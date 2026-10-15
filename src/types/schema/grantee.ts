import { PublicKey, Reference } from '@ethersphere/core-sdk'
import { z } from 'zod'

export const GetGranteesBodyResponse = z.array(z.string().transform(s => new PublicKey(s)))

export const GranteesResultBodyResponse = z.object({
  ref: z.string().transform(s => new Reference(s)),
  historyref: z.string().transform(s => new Reference(s)),
})
