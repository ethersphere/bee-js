import { z } from 'zod'

export const TagSchema = z.object({
  address: z.string().nullish().transform(v => v ?? ''),
  seen: z.number(),
  sent: z.number(),
  split: z.number(),
  startedAt: z.string(),
  stored: z.number(),
  synced: z.number(),
  uid: z.number(),
})

export const GetAllTagsResponse = z.object({
  tags: z.array(TagSchema),
})
