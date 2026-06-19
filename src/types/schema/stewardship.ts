import { z } from 'zod'

export const IsRetrievableResponse = z.object({
  isRetrievable: z.boolean(),
})
