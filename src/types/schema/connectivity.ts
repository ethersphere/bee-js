import { z } from 'zod'
import { EthAddress, PeerAddress, PublicKey } from '../../utils/typed-bytes'

const PeerSchema = z.object({
  address: z.string(),
  fullNode: z.boolean(),
})

const BinSchema = z.object({
  population: z.number(),
  connected: z.number(),
  connectedPeers: z
    .array(z.object({ address: z.string() }))
    .nullish()
    .transform(v => v ?? []),
  disconnectedPeers: z
    .array(z.object({ address: z.string() }))
    .nullish()
    .transform(v => v ?? []),
})

const BinRecord = z.record(z.string(), BinSchema)

export const GetNodeAddressesResponse = z.object({
  overlay: z.string().transform(s => new PeerAddress(s)),
  underlay: z.array(z.string()),
  ethereum: z.string().transform(s => new EthAddress(s)),
  publicKey: z.string().transform(s => new PublicKey(s)),
  pssPublicKey: z.string().transform(s => new PublicKey(s)),
})

export const GetPeersResponse = z.object({
  peers: z.array(PeerSchema),
})

export const GetBlocklistResponse = z.object({
  peers: z.array(PeerSchema),
})

export const GetTopologyResponse = z.object({
  baseAddr: z.string(),
  population: z.number(),
  connected: z.number(),
  timestamp: z.string(),
  nnLowWatermark: z.number(),
  depth: z.number(),
  reachability: z.string(),
  networkAvailability: z.string(),
  bins: BinRecord,
})
