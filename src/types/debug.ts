export interface Settlements {
  peer: string
  received: number
  sent: number
}

export interface AllSettlements {
  totalreceived: number
  totalsent: number
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
  totalBalance: number
  availableBalance: number
}

export interface CashoutResult {
  recipient: string
  lastPayout: number
  bounced: boolean
}

export interface LastCashoutActionResponse {
  peer: string
  chequebook: string
  cumulativePayout: number
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
  payout: number
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
  balance: number
}

export interface BalanceResponse {
  balances: PeerBalance[]
}

export interface Health {
  status: string
}

export interface Readiness {
  status: string
}

export interface RemovePeerResponse {
  message: string
  code: 0
}

export interface Bins {
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
  bins: Bins[]
}

export interface PingResponse {
  rtt: string
}
