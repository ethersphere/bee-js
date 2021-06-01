export interface Settlements {
  peer: string
  received: bigint
  sent: bigint
}

export interface AllSettlements {
  totalReceived: bigint
  totalSent: bigint
  settlements: Settlements[]
}

export interface NodeAddresses {
  overlay: string
  underlay: string[]
  ethereum: string
  publicKey: string
  pssPublicKey: string
}

export interface Peer {
  address: string
}

export interface ChequebookAddressResponse {
  chequebookAddress: string
}

export interface ChequebookBalanceResponse {
  totalBalance: bigint
  availableBalance: bigint
}

export interface CashoutOptions {
  /**
   * Gas price for the cashout transaction in WEI
   */
  gasPrice?: bigint

  /**
   * Gas limit for the cashout transaction in WEI
   */
  gasLimit?: bigint
}

export interface CashoutResult {
  recipient: string
  lastPayout: bigint
  bounced: boolean
}

export interface LastCashoutActionResponse {
  peer: string
  uncashedAmount: bigint
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
  payout: bigint
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
  balance: bigint
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
  available: number
  outer: number
  inner: number
}

export interface ChainState {
  block: bigint
  totalAmount: bigint
  currentPrice: bigint
}
