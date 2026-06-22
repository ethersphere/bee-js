import { z } from 'zod'
import { toBeeMode } from '../debug'

export const GetDebugStatusResponse = z.object({
  overlay: z.string(),
  proximity: z.number(),
  beeMode: z.string().transform(toBeeMode),
  reserveSize: z.number(),
  reserveSizeWithinRadius: z.number(),
  pullsyncRate: z.number(),
  storageRadius: z.number(),
  connectedPeers: z.number(),
  neighborhoodSize: z.number(),
  batchCommitment: z.number(),
  isReachable: z.boolean(),
  lastSyncedBlock: z.number(),
  committedDepth: z.number(),
  isWarmingUp: z.boolean(),
})

export const GetHealthResponse = z.object({
  apiVersion: z.string(),
  version: z.string(),
  status: z.literal('ok'),
})

export const GetReadinessResponse = z.object({
  apiVersion: z.string(),
  version: z.string(),
  status: z.enum(['ready', 'notReady']),
})

export const GetNodeInfoResponse = z.object({
  beeMode: z.string().transform(toBeeMode),
  chequebookEnabled: z.boolean(),
  swapEnabled: z.boolean(),
})

export const IsGatewayResponse = z.object({
  gateway: z.boolean(),
})
