import { z } from 'zod'

export const GetAllPinsResponse = z.object({
  references: z.array(z.string()).nullable(),
})
