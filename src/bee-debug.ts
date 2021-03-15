import * as connectivity from './modules/debug/connectivity'
import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as settlements from './modules/debug/settlements'
import * as status from './modules/debug/status'
import type {
  PublicKey,
  Address,
  Peer,
  BalanceResponse,
  PeerBalance,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastChequesResponse,
  LastChequesForPeerResponse,
  LastCashoutActionResponse,
  CashoutResponse,
  DepositTokensResponse,
  WithdrawTokensResponse,
  Settlements,
  AllSettlements,
  RemovePeerResponse,
  Topology,
  PingResponse,
  Health,
  Readiness,
} from './types'
import { assertBeeUrl, stripLastSlash } from './utils/url'
import { assertInteger } from './utils/type'

/**
 * The BeeDebug class provides a way of interacting with the Bee debug APIs based on the provided url
 *
 * @param url URL of a running Bee node
 */
export class BeeDebug {
  public readonly url: string

  constructor(url: string) {
    assertBeeUrl(url)

    // Remove last slash if present, as our endpoint strings starts with `/...`
    // which could lead to double slash in URL to which Bee responds with
    // unnecessary redirects.
    this.url = stripLastSlash(url)
  }
  async getOverlayAddress(): Promise<Address> {
    const nodeAddresses = await connectivity.getNodeAddresses(this.url)

    return nodeAddresses.overlay
  }

  async getPssPublicKey(): Promise<PublicKey> {
    const nodeAddresses = await connectivity.getNodeAddresses(this.url)

    return nodeAddresses.pss_public_key
  }

  async getEthAddress(): Promise<PublicKey> {
    const nodeAddresses = await connectivity.getNodeAddresses(this.url)

    return nodeAddresses.ethereum
  }

  /**
   * Get list of peers for this node
   */
  getPeers(): Promise<Peer[]> {
    return connectivity.getPeers(this.url)
  }

  removePeer(peer: string): Promise<RemovePeerResponse> {
    return connectivity.removePeer(this.url, peer)
  }

  getTopology(): Promise<Topology> {
    return connectivity.getTopology(this.url)
  }

  pingPeer(peer: string): Promise<PingResponse> {
    return connectivity.pingPeer(this.url, peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  getAllBalances(): Promise<BalanceResponse> {
    return balance.getAllBalances(this.url)
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Swarm address of peer
   */
  getPeerBalance(address: Address): Promise<PeerBalance> {
    return balance.getPeerBalance(this.url, address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  getPastDueConsumptionBalances(): Promise<BalanceResponse> {
    return balance.getPastDueConsumptionBalances(this.url)
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Swarm address of peer
   */
  getPastDueConsumptionPeerBalance(address: Address): Promise<PeerBalance> {
    return balance.getPastDueConsumptionPeerBalance(this.url, address)
  }

  /*
   * Chequebook endpoints
   */

  /**
   * Get the address of the chequebook contract used.
   *
   * **Warning:** The address is returned with 0x prefix unlike all other calls.
   * https://github.com/ethersphere/bee/issues/1443
   */
  getChequebookAddress(): Promise<ChequebookAddressResponse> {
    return chequebook.getChequebookAddress(this.url)
  }

  /**
   * Get the balance of the chequebook
   */
  getChequebookBalance(): Promise<ChequebookBalanceResponse> {
    return chequebook.getChequebookBalance(this.url)
  }

  /**
   * Get last cheques for all peers
   */
  getLastCheques(): Promise<LastChequesResponse> {
    return chequebook.getLastCheques(this.url)
  }

  /**
   * Get last cheques for the peer
   *
   * @param address  Swarm address of peer
   */
  getLastChequesForPeer(address: Address): Promise<LastChequesForPeerResponse> {
    return chequebook.getLastChequesForPeer(this.url, address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Swarm address of peer
   */
  getLastCashoutAction(address: Address): Promise<LastCashoutActionResponse> {
    return chequebook.getLastCashoutAction(this.url, address)
  }

  /**
   * Cashout the last cheque for the peer
   *
   * @param address  Swarm address of peer
   */
  cashoutLastCheque(address: string): Promise<CashoutResponse> {
    return chequebook.cashoutLastCheque(this.url, address)
  }

  /**
   * Deposit tokens from overlay address into chequebook
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   */
  depositTokens(amount: number | BigInt): Promise<DepositTokensResponse> {
    assertInteger(amount)

    if (amount < 0) throw new TypeError('must be positive number')

    return chequebook.depositTokens(this.url, amount)
  }

  /**
   * Withdraw tokens from the chequebook to the overlay address
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   */
  withdrawTokens(amount: number | BigInt): Promise<WithdrawTokensResponse> {
    assertInteger(amount)

    if (amount < 0) throw new TypeError('must be positive number')

    return chequebook.withdrawTokens(this.url, amount)
  }

  /*
   * Settlements endpoint
   */

  /**
   * Get amount of sent and received from settlements with a peer
   *
   * @param address  Swarm address of peer
   */
  getSettlements(address: Address): Promise<Settlements> {
    return settlements.getSettlements(this.url, address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  getAllSettlements(): Promise<AllSettlements> {
    return settlements.getAllSettlements(this.url)
  }

  getHealth(): Promise<Health> {
    return status.getHealth(this.url)
  }

  getReadiness(): Promise<Readiness> {
    return status.getReadiness(this.url)
  }
}
