import { Reference } from '@ethersphere/core-sdk'
import { z } from 'zod'

export const UploadResultBody = z.object({
  reference: z.string().transform(s => new Reference(s)),
})
