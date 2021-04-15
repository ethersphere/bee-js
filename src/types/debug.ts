export interface Settlements {
  peer: string
  received: BigInt
  sent: BigInt
}

export interface AllSettlements {
  totalreceived: BigInt
  totalsent: BigInt
  settlements: Settlements[]
}

export interface NodeAddresses {
  overlay: string
  underlay: string[]
  ethereum: string
  public_key: string
  pss_public_key: string
}

export interface Peer {
  address: string
}

export interface ChequebookAddressResponse {
  // see this issue regarding the naming https://github.com/ethersphere/bee/issues/1078
  chequebookaddress: string
}

export interface ChequebookBalanceResponse {
  totalBalance: BigInt
  availableBalance: BigInt
}

export interface CashoutResult {
  recipient: string
  lastPayout: BigInt
  bounced: boolean
}

export interface LastCashoutActionResponse {
  peer: string
  chequebook: string
  cumulativePayout: BigInt
  beneficiary: string
  transactionHash: string
  result: CashoutResult
}

export interface CashoutResponse {
  transactionHash: string
}

export interface Cheque {
  beneficiary: string
  chequebook: string
  payout: BigInt
}

export interface LastChequesForPeerResponse {
  peer: string
  lastreceived: Cheque
  lastsent: Cheque
}

export interface LastChequesResponse {
  lastcheques: LastChequesForPeerResponse[]
}
export interface DepositTokensResponse {
  transactionHash: string
}

export interface WithdrawTokensResponse {
  transactionHash: string
}

export interface PeerBalance {
  peer: string
  balance: BigInt
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
