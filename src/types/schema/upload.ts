import { Reference } from 'swarm-core'
import { z } from 'zod'

export const UploadResultBody = z.object({
  reference: z.string().transform(s => new Reference(s)),
})
