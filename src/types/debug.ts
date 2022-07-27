import { PublicKey, NumberString, Reference, TransactionHash, RequestOptions } from './index'
import { HexEthAddress } from '../utils/eth'

/**
 * Object that contains information about progress of upload of data to network.
 *
 * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
 */
export interface ExtendedTag {
  /**
   * Number of all chunks that the data will be split into.
   */
  total: number

  /**
   * Number of chunks already processed by splitter for hashing
   */
  split: number

  /**
   * Number of chunks already seen
   */
  seen: number

  /**
   * Number of chunks already stored locally
   */
  stored: number

  /**
   * Number of chunks sent for push syncing
   */
  sent: number

  /**
   * Number of chunks synced with proof
   */
  synced: number

  /**
   * Unique identifier
   */
  uid: number

  /**
   * The associated swarm hash for this tag
   */
  address: Reference

  /**
   * When the upload process started
   */
  startedAt: string
}

export interface Settlements {
  peer: string
  received: NumberString
  sent: NumberString
}

export interface AllSettlements {
  totalReceived: NumberString
  totalSent: NumberString
  settlements: Settlements[]
}

export interface NodeAddresses {
  overlay: string
  underlay: string[]
  ethereum: HexEthAddress
  publicKey: PublicKey
  pssPublicKey: PublicKey
}

export interface Peer {
  address: string
}

export interface ChequebookAddressResponse {
  chequebookAddress: string
}

export interface ChequebookBalanceResponse {
  totalBalance: NumberString
  availableBalance: NumberString
}

export interface CashoutOptions extends RequestOptions {
  /**
   * Gas price for the cashout transaction in WEI
   */
  gasPrice?: NumberString

  /**
   * Gas limit for the cashout transaction in WEI
   */
  gasLimit?: NumberString
}

export interface CashoutResult {
  recipient: string
  lastPayout: NumberString
  bounced: boolean
}

export interface LastCashoutActionResponse {
  peer: string
  uncashedAmount: NumberString
  transactionHash: string | null
  lastCashedCheque: Cheque | null
  result: CashoutResult | null
}

export interface TransactionResponse {
  transactionHash: TransactionHash
}

export interface Cheque {
  beneficiary: string
  chequebook: string
  payout: NumberString
}

export interface LastChequesForPeerResponse {
  peer: string
  lastreceived: Cheque
  lastsent: Cheque
}

export interface LastChequesResponse {
  lastcheques: LastChequesForPeerResponse[]
}

export interface PeerBalance {
  peer: string
  balance: NumberString
}

export interface BalanceResponse {
  balances: PeerBalance[]
}

export interface Health {
  status: 'ok'
  version: string
  apiVersion: string
  debugApiVersion: string
}

export interface BeeVersions {
  supportedBeeVersion: string
  supportedBeeApiVersion: string
  supportedBeeDebugApiVersion: string
  beeVersion: string
  beeApiVersion: string
  beeDebugApiVersion: string
}

export enum BeeModes {
  FULL = 'full',
  LIGHT = 'light',
  ULTRA_LIGHT = 'ultra-light',
  DEV = 'dev',
}

/**
 * Information about Bee node and its configuration
 */
export interface NodeInfo {
  /**
   * Indicates whether the node is in a Gateway mode.
   * Gateway mode is a restricted mode where some features are not available.
   */
  gatewayMode: boolean

  /**
   * Indicates in what mode Bee is running.
   */
  beeMode: BeeModes

  /**
   * Indicates whether the Bee node has its own deployed chequebook.
   *
   * @see [Bee docs - Chequebook](https://docs.ethswarm.org/docs/introduction/terminology#cheques--chequebook)
   */
  chequebookEnabled: boolean

  /**
   * Indicates whether SWAP is enabled for the Bee node.
   *
   * @see [Bee docs - SWAP](https://docs.ethswarm.org/docs/introduction/terminology#swap)
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
  disconnectedPeers: Peer[] | null
  connectedPeers: Peer[] | null
}

export interface Topology {
  baseAddr: string
  population: number
  connected: number
  timestamp: string
  nnLowWatermark: number
  depth: number
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
  }
}

export interface PingResponse {
  rtt: string
}

export interface ReserveState {
  radius: number
  commitment: number
  storageRadius: number
}

export interface ChainState {
  block: number
  totalAmount: NumberString
  currentPrice: NumberString
}

export interface WalletBalance {
  /**
   * Balance of BZZ tokens
   */
  bzz: NumberString

  /**
   * Balance of xDai
   */
  xDai: NumberString

  /**
   * Chain network ID to which the Bee node is connected
   */
  chainID: number

  /**
   * Chequebook contract address
   */
  contractAddress: string
}
