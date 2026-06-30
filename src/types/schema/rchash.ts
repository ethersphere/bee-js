import { z } from 'zod'

export const RchashResponse = z.object({
  durationSeconds: z.number(),
})
