import { BZZ, DAI } from '../utils/tokens'
import { EthAddress, PeerAddress, PublicKey, TransactionId } from '../utils/typed-bytes'
import { NumberString } from './index'

export interface Settlements {
  peer: string
  received: BZZ
  sent: BZZ
}

export interface AllSettlements {
  totalReceived: BZZ
  totalSent: BZZ
  settlements: Settlements[]
}

export interface NodeAddresses {
  overlay: PeerAddress
  underlay: string[]
  ethereum: EthAddress
  publicKey: PublicKey
  pssPublicKey: PublicKey
}

export interface Peer {
  address: string
  fullNode?: boolean
}

export interface ChequebookAddressResponse {
  chequebookAddress: string
}

export interface ChequebookBalanceResponse {
  totalBalance: BZZ
  availableBalance: BZZ
}

export interface TransactionOptions {
  /**
   * Gas price for the cashout transaction in WEI
   */
  gasPrice?: NumberString | string | bigint

  /**
   * Gas limit for the cashout transaction in WEI
   */
  gasLimit?: NumberString | string | bigint
}

export interface CashoutResult {
  recipient: string
  lastPayout: BZZ
  bounced: boolean
}

export interface LastCashoutActionResponse {
  peer: string
  uncashedAmount: BZZ
  transactionHash: string | null
  lastCashedCheque: Cheque | null
  result: CashoutResult | null
}

export interface TransactionResponse {
  transactionHash: TransactionId
}

export interface Cheque {
  beneficiary: EthAddress
  chequebook: EthAddress
  payout: BZZ
}

export interface LastChequesForPeerResponse {
  peer: string
  lastreceived: Cheque | null
  lastsent: Cheque | null
}

export interface LastChequesResponse {
  lastcheques: LastChequesForPeerResponse[]
}

export interface PeerBalance {
  peer: string
  balance: BZZ
}

export interface BalanceResponse {
  balances: PeerBalance[]
}

export interface DebugStatus {
  overlay: string
  proximity: number
  beeMode: BeeModes
  reserveSize: number
  reserveSizeWithinRadius: number
  pullsyncRate: number
  storageRadius: number
  connectedPeers: number
  neighborhoodSize: number
  batchCommitment: number
  isReachable: boolean
  lastSyncedBlock: number
  committedDepth: number
  isWarmingUp: boolean
}

export interface Health {
  status: 'ok'
  version: string
  apiVersion: string
}

export interface Readiness {
  status: 'ready' | string
  version: string
  apiVersion: string
}

export interface BeeVersions {
  supportedBeeVersion: string
  supportedBeeApiVersion: string
  beeVersion: string
  beeApiVersion: string
}

export enum BeeModes {
  FULL = 'full',
  LIGHT = 'light',
  ULTRA_LIGHT = 'ultra-light',
  DEV = 'dev',
}

export function toBeeMode(value: string) {
  switch (value) {
    case 'full':
      return BeeModes.FULL
    case 'light':
      return BeeModes.LIGHT
    case 'ultra-light':
      return BeeModes.ULTRA_LIGHT
    case 'dev':
      return BeeModes.DEV
    default:
      throw new Error(`Unknown Bee mode: ${value}`)
  }
}

export interface RedistributionState {
  minimumGasFunds: DAI
  hasSufficientFunds: boolean
  isFrozen: boolean
  isFullySynced: boolean
  phase: string
  round: number
  lastWonRound: number
  lastPlayedRound: number
  lastFrozenRound: number
  lastSelectedRound: number
  lastSampleDurationSeconds: number
  block: number
  reward: BZZ
  fees: DAI
  isHealthy: boolean
}

/**
 * Information about Bee node and its configuration
 */
export interface NodeInfo {
  /**
   * Indicates in what mode Bee is running.
   */
  beeMode: BeeModes

  /**
   * Indicates whether the Bee node has its own deployed chequebook.
   *
   * @see [Bee docs - Chequebook](https://docs.ethswarm.org/docs/references/glossary/#cheques--chequebook)
   */
  chequebookEnabled: boolean

  /**
   * Indicates whether SWAP is enabled for the Bee node.
   *
   * @see [Bee docs - SWAP](https://docs.ethswarm.org/docs/references/glossary/#swap)
   */
  swapEnabled: boolean
}

export interface RemovePeerResponse {
  message: string
  code: 0
}

export interface Bin {
  population: number
  connected: number
  disconnectedPeers: Peer[]
  connectedPeers: Peer[]
}

export interface Topology {
  baseAddr: string
  population: number
  connected: number
  timestamp: string
  nnLowWatermark: number
  depth: number
  reachability: string
  networkAvailability: string
  bins: {
    bin_0: Bin
    bin_1: Bin
    bin_2: Bin
    bin_3: Bin
    bin_4: Bin
    bin_5: Bin
    bin_6: Bin
    bin_7: Bin
    bin_8: Bin
    bin_9: Bin
    bin_10: Bin
    bin_11: Bin
    bin_12: Bin
    bin_13: Bin
    bin_14: Bin
    bin_15: Bin
    bin_16: Bin
    bin_17: Bin
    bin_18: Bin
    bin_19: Bin
    bin_20: Bin
    bin_21: Bin
    bin_22: Bin
    bin_23: Bin
    bin_24: Bin
    bin_25: Bin
    bin_26: Bin
    bin_27: Bin
    bin_28: Bin
    bin_29: Bin
    bin_30: Bin
    bin_31: Bin
  }
}

export interface PingResponse {
  rtt: string
}

export interface ReserveState {
  radius: number
  storageRadius: number
  commitment: number
}

export interface ChainState {
  chainTip: number
  block: number
  totalAmount: NumberString
  currentPrice: number
}

export interface WalletBalance {
  bzzBalance: BZZ
  nativeTokenBalance: DAI
  chainID: number
  chequebookContractAddress: string
  walletAddress: string
}
