export interface GetChequebookAddress {
  chequebookAddress: string
}

export interface Payment {
  beneficiary: string
  chequebook: string
  payout: string
}

export interface PeerCheques {
  peer: string
  lastreceived?: Payment | null
  lastsent?: Payment | null
}

export interface GetStamps {
  stamps: Stamp[]
}

export interface Peer {
  address: string
  fullNode: boolean
}

export interface GetStatus {
  peer: string
  beeMode: string
  proximity: number
  reserveSize: number
  reserveSizeWithinRadius: number
  pullsyncRate: number
  storageRadius: number
  connectedPeers: number
  neighborhoodSize: number
  batchCommitment: number
  isReachable: boolean
}

export interface GetSettlements {
  totalReceived: string
  totalSent: string
  settlements: Settlement[]
}

export interface TopologyBinProperty {
  population: number
  connected: number
  disconnectedPeers: PeerWithMetrics[]
  connectedPeers: PeerWithMetrics[]
}

export interface GetChequebookBalance {
  totalBalance: string
  availableBalance: string
}

export interface PeerAccounting {
  balance: string
  thresholdReceived: string
  thresholdGiven: string
  surplusBalance: string
  reservedBalance: string
  shadowReservedBalance: string
  ghostBalance: string
}

export interface GetChainstate {
  chainTip: number
  block: number
  totalAmount: string
  currentPrice: string
}

export interface PeerWithMetrics {
  address: string
  metrics?: PeerMetrics | null
}

export interface GetStake {
  stakedAmount: string
}

export interface GetWallet {
  bzzBalance: string
  nativeTokenBalance: string
  chainID: number
  chequebookContractAddress: string
  walletAddress: string
}

export interface GetBatches {
  batches: GlobalStamp[]
}

export interface Settlement {
  peer: string
  received: string
  sent: string
}

export interface GetHealth {
  status: string
  version: string
  apiVersion: string
}

export interface GlobalStamp {
  batchID: string
  value: string
  start: number
  depth: number
  bucketDepth: number
  immutable: boolean
  batchTTL: number
  owner: string
}

export interface Stamp {
  batchID: string
  utilization: number
  usable: boolean
  label: string
  depth: number
  amount: string
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
  exists: boolean
  batchTTL: number
}

export interface GetReservestate {
  radius: number
  storageRadius: number
  commitment: number
}

export interface GetPeers {
  peers: Peer[]
}

export interface GetTopology {
  baseAddr: string
  population: number
  connected: number
  timestamp: string
  nnLowWatermark: number
  depth: number
  reachability: string
  networkAvailability: string
  bins: TopologyBins
  lightNodes: TopologyBinProperty
}

export interface GetReadiness {
  code: number
  message: string
  reasons: string[]
}

export interface GetChequebookCheque {
  lastcheques: PeerCheques[]
}

export interface PeerWithBalance {
  peer: string
  balance: string
  thresholdreceived?: string | null
  thresholdgiven?: string | null
}

export interface WrappedAddress {
  address: string
}

export interface GetBalances {
  balances: PeerWithBalance[]
}

export interface GetRedistributionstate {
  minimumGasFunds: string
  hasSufficientFunds: boolean
  isFrozen: boolean
  isFullySynced: boolean
  isHealthy: boolean
  phase: string
  round: number
  lastWonRound: number
  lastPlayedRound: number
  lastFrozenRound: number
  lastSelectedRound: number
  lastSampleDuration: string
  block: number
  reward: string
  fees: string
}

export interface GetTimesettlements {
  totalReceived: string
  totalSent: string
  settlements: Settlement[]
}

export interface GetNode {
  beeMode: string
  chequebookEnabled: boolean
  swapEnabled: boolean
}

export interface PeerMetrics {
  lastSeenTimestamp: number
  sessionConnectionRetry: number
  connectionTotalDuration: number
  sessionConnectionDuration: number
  sessionConnectionDirection: string
  latencyEWMA: number
  reachability: string
  healthy: boolean
}

export interface TopologyBins {
  bin_0: TopologyBinProperty
  bin_1: TopologyBinProperty
  bin_2: TopologyBinProperty
  bin_3: TopologyBinProperty
  bin_4: TopologyBinProperty
  bin_5: TopologyBinProperty
  bin_6: TopologyBinProperty
  bin_7: TopologyBinProperty
  bin_8: TopologyBinProperty
  bin_9: TopologyBinProperty
  bin_10: TopologyBinProperty
  bin_11: TopologyBinProperty
  bin_12: TopologyBinProperty
  bin_13: TopologyBinProperty
  bin_14: TopologyBinProperty
  bin_15: TopologyBinProperty
  bin_16: TopologyBinProperty
  bin_17: TopologyBinProperty
  bin_18: TopologyBinProperty
  bin_19: TopologyBinProperty
  bin_20: TopologyBinProperty
  bin_21: TopologyBinProperty
  bin_22: TopologyBinProperty
  bin_23: TopologyBinProperty
  bin_24: TopologyBinProperty
  bin_25: TopologyBinProperty
  bin_26: TopologyBinProperty
  bin_27: TopologyBinProperty
  bin_28: TopologyBinProperty
  bin_29: TopologyBinProperty
  bin_30: TopologyBinProperty
  bin_31: TopologyBinProperty
}

export interface GetAddresses {
  overlay: string
  underlay: string[]
  ethereum: string
  publicKey: string
  pssPublicKey: string
}

export interface GetWelcomeMessage {
  welcomeMessage: string
}
