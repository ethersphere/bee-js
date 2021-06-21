import { PublicKey, NumberString } from './index'
import { HexEthAddress } from '../utils/eth'

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

export interface CashoutOptions {
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
  transactionHash: string
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
  storageRadius: number
  available: number
  outer: NumberString
  inner: NumberString
}

export interface ChainState {
  block: number
  totalAmount: NumberString
  currentPrice: NumberString
}
