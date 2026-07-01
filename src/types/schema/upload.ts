import { z } from 'zod'
import { Reference } from '../../utils/typed-bytes'

export const UploadResultBody = z.object({
  reference: z.string().transform(s => new Reference(s)),
})
