import { z } from 'zod'
import { hexToUint8Array } from 'swarm-core'

export const PostEnvelopeBodyResponse = z.object({
  issuer: z.string().transform(s => hexToUint8Array(s)),
  index: z.string().transform(s => hexToUint8Array(s)),
  timestamp: z.string().transform(s => hexToUint8Array(s)),
  signature: z.string().transform(s => hexToUint8Array(s)),
})
