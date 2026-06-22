import { z } from 'zod'
import { TAGS_LIMIT_MAX, TAGS_LIMIT_MIN, type NumberString } from '../types'
import { PublicKey, Reference } from './typed-bytes'

export { HexStringSchema } from './hex-schema'

const fnField = z.any().refine(v => z.function().safeParse(v).success, 'expected a function')

const integerStringField = z.any().transform((v: unknown): NumberString => {
  if (z.bigint().safeParse(v).success) v = String(v)

  return z
    .string()
    .regex(/^-?\d+$/, 'expected integer string')
    .parse(v) as NumberString
})

const nonNegativeIntegerStringField = z.any().transform((v: unknown): NumberString => {
  if (z.bigint().safeParse(v).success) v = String(v)

  return z.string().regex(/^\d+$/, 'expected non-negative integer string').parse(v) as NumberString
})

export const BeeRequestOptionsSchema = z.object({
  baseURL: z.string().optional(),
  timeout: z.number().int().min(0).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  onRequest: fnField.optional(),
  httpAgent: z.unknown().optional(),
  httpsAgent: z.unknown().optional(),
  endlesslyRetry: z.boolean().optional(),
  signal: z.any().optional(),
})

export const DownloadOptionsSchema = z.object({
  redundancyStrategy: z.number().int().optional(),
  fallback: z.boolean().optional(),
  timeoutMs: z.number().int().min(0).optional(),
  actPublisher: z.optional(z.any().transform((v): PublicKey => new PublicKey(v))),
  actHistoryAddress: z.optional(z.any().transform((v): Reference => new Reference(v))),
  actTimestamp: z.coerce.number().optional(),
})

export const UploadOptionsSchema = z.object({
  act: z.boolean().optional(),
  actHistoryAddress: z.optional(z.any().transform((v): Reference => new Reference(v))),
  deferred: z.boolean().optional(),
  encrypt: z.boolean().optional(),
  pin: z.boolean().optional(),
  tag: z.number().int().min(0).optional(),
})

export const RedundantUploadOptionsSchema = UploadOptionsSchema.extend({
  redundancyLevel: z.number().int().min(0).optional(),
})

export const FileUploadOptionsSchema = UploadOptionsSchema.extend({
  size: z.number().int().min(0).optional(),
  contentType: z.string().optional(),
  redundancyLevel: z.number().int().min(0).optional(),
})

export const CollectionUploadOptionsSchema = UploadOptionsSchema.extend({
  errorDocument: z.string().optional(),
  indexDocument: z.string().optional(),
  redundancyLevel: z.number().int().min(0).optional(),
})

export const TagInputSchema = z.object({ uid: z.number().int() })

export const TagUidSchema = z.coerce.number().min(0)

export const PssMessageHandlerSchema = z.object({
  onMessage: fnField,
  onError: fnField,
  onClose: fnField,
})

export const GsocMessageHandlerSchema = z.object({
  onMessage: fnField,
  onError: fnField,
  onClose: fnField,
})

export const PostageBatchOptionsSchema = z.object({
  gasPrice: integerStringField.optional(),
  immutableFlag: z.boolean().optional(),
  label: z.string().optional(),
  waitForUsable: z.boolean().optional(),
  waitForUsableTimeout: z.number().int().min(0).optional(),
})

export const TransactionOptionsSchema = z.object({
  gasLimit: nonNegativeIntegerStringField.optional(),
  gasPrice: nonNegativeIntegerStringField.optional(),
})

export const AllTagsOptionsSchema = z.object({
  limit: z.number().int().min(TAGS_LIMIT_MIN).max(TAGS_LIMIT_MAX).optional(),
  offset: z.number().int().min(0).optional(),
})
