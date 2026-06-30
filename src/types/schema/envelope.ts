import { Binary } from 'cafe-utility'
import { z } from 'zod'

export const PostEnvelopeBodyResponse = z.object({
  issuer: z.string().transform(s => Binary.hexToUint8Array(s)),
  index: z.string().transform(s => Binary.hexToUint8Array(s)),
  timestamp: z.string().transform(s => Binary.hexToUint8Array(s)),
  signature: z.string().transform(s => Binary.hexToUint8Array(s)),
})
