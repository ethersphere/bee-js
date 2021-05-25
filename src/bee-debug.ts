import * as connectivity from './modules/debug/connectivity'
import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as settlements from './modules/debug/settlements'
import * as status from './modules/debug/status'
import type {
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
  NodeAddresses,
} from './types'
import { assertBeeUrl, stripLastSlash } from './utils/url'
import { assertAddress, assertInteger, assertNonNegativeInteger } from './utils/type'
import { CashoutOptions } from './types'

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

  getNodeAddresses(): Promise<NodeAddresses> {
    return connectivity.getNodeAddresses(this.url)
  }

  getBlocklist(): Promise<Peer[]> {
    return connectivity.getBlocklist(this.url)
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
  getPeerBalance(address: Address | string): Promise<PeerBalance> {
    assertAddress(address)

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
  getPastDueConsumptionPeerBalance(address: Address | string): Promise<PeerBalance> {
    assertAddress(address)

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
  getLastChequesForPeer(address: Address | string): Promise<LastChequesForPeerResponse> {
    assertAddress(address)

    return chequebook.getLastChequesForPeer(this.url, address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Swarm address of peer
   */
  getLastCashoutAction(address: Address | string): Promise<LastCashoutActionResponse> {
    assertAddress(address)

    return chequebook.getLastCashoutAction(this.url, address)
  }

  /**
   * Cashout the last cheque for the peer
   *
   * @param address  Swarm address of peer
   * @param options
   * @param options.gasPrice Gas price for the cashout transaction in WEI
   * @param options.gasLimit Gas limit for the cashout transaction in WEI
   */
  // eslint-disable-next-line require-await
  async cashoutLastCheque(address: string | Address, options?: CashoutOptions): Promise<string> {
    assertAddress(address)

    if (options?.gasLimit) {
      assertNonNegativeInteger(options.gasLimit)
    }

    if (options?.gasPrice) {
      assertNonNegativeInteger(options.gasPrice)
    }

    return chequebook.cashoutLastCheque(this.url, address, options)
  }

  /**
   * Deposit tokens from overlay address into chequebook
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   */
  depositTokens(amount: number | bigint): Promise<DepositTokensResponse> {
    assertInteger(amount)

    if (amount < 0) throw new TypeError('must be positive number')

    return chequebook.depositTokens(this.url, amount)
  }

  /**
   * Withdraw tokens from the chequebook to the overlay address
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   */
  withdrawTokens(amount: number | bigint): Promise<WithdrawTokensResponse> {
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
  getSettlements(address: Address | string): Promise<Settlements> {
    assertAddress(address)

    return settlements.getSettlements(this.url, address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  getAllSettlements(): Promise<AllSettlements> {
    return settlements.getAllSettlements(this.url)
  }

  /**
   * Get health of node
   */
  getHealth(): Promise<Health> {
    return status.getHealth(this.url)
  }

  /**
   * Connnects to a node and checks if it is a supported Bee version by the bee-js
   *
   * @returns true if the Bee node version is supported
   */
  isSupportedVersion(): Promise<boolean> | never {
    return status.isSupportedVersion(this.url)
  }
}
