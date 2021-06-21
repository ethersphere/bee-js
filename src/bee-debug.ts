import { BeeArgumentError } from '.'
import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as connectivity from './modules/debug/connectivity'
import * as settlements from './modules/debug/settlements'
import * as states from './modules/debug/states'
import * as status from './modules/debug/status'
import * as stamps from './modules/stamps'
import {
  Address,
  AllSettlements,
  BalanceResponse,
  BatchId,
  CashoutOptions,
  ChainState,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  Health,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NodeAddresses,
  NumberString,
  Peer,
  PeerBalance,
  PingResponse,
  PostageBatch,
  PostageBatchOptions,
  RemovePeerResponse,
  ReserveState,
  Settlements,
  STAMPS_DEPTH_MAX,
  STAMPS_DEPTH_MIN,
  Topology,
} from './types'
import { assertAddress, assertBatchId, assertBoolean, assertNonNegativeInteger } from './utils/type'
import { assertBeeUrl, stripLastSlash } from './utils/url'

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

  async getNodeAddresses(): Promise<NodeAddresses> {
    return connectivity.getNodeAddresses(this.url)
  }

  async getBlocklist(): Promise<Peer[]> {
    return connectivity.getBlocklist(this.url)
  }

  /**
   * Get list of peers for this node
   */
  async getPeers(): Promise<Peer[]> {
    return connectivity.getPeers(this.url)
  }

  async removePeer(peer: string | Address): Promise<RemovePeerResponse> {
    assertAddress(peer)

    return connectivity.removePeer(this.url, peer)
  }

  async getTopology(): Promise<Topology> {
    return connectivity.getTopology(this.url)
  }

  async pingPeer(peer: string | Address): Promise<PingResponse> {
    assertAddress(peer)

    return connectivity.pingPeer(this.url, peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  async getAllBalances(): Promise<BalanceResponse> {
    return balance.getAllBalances(this.url)
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Swarm address of peer
   */
  async getPeerBalance(address: Address | string): Promise<PeerBalance> {
    assertAddress(address)

    return balance.getPeerBalance(this.url, address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  async getPastDueConsumptionBalances(): Promise<BalanceResponse> {
    return balance.getPastDueConsumptionBalances(this.url)
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Swarm address of peer
   */
  async getPastDueConsumptionPeerBalance(address: Address | string): Promise<PeerBalance> {
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
  async getChequebookAddress(): Promise<ChequebookAddressResponse> {
    return chequebook.getChequebookAddress(this.url)
  }

  /**
   * Get the balance of the chequebook
   */
  async getChequebookBalance(): Promise<ChequebookBalanceResponse> {
    return chequebook.getChequebookBalance(this.url)
  }

  /**
   * Get last cheques for all peers
   */
  async getLastCheques(): Promise<LastChequesResponse> {
    return chequebook.getLastCheques(this.url)
  }

  /**
   * Get last cheques for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastChequesForPeer(address: Address | string): Promise<LastChequesForPeerResponse> {
    assertAddress(address)

    return chequebook.getLastChequesForPeer(this.url, address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastCashoutAction(address: Address | string): Promise<LastCashoutActionResponse> {
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
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async depositTokens(amount: number | NumberString, gasPrice?: NumberString): Promise<string> {
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.depositTokens(this.url, amount, gasPrice)
  }

  /**
   * Withdraw tokens from the chequebook to the overlay address
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async withdrawTokens(amount: number | NumberString, gasPrice?: NumberString): Promise<string> {
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.withdrawTokens(this.url, amount, gasPrice)
  }

  /**
   * Creates new postage batch from the funds that the node has available in its Ethereum account.
   *
   * @param amount Amount that represents the value per chunk, has to be greater or equal zero.
   * @param depth Logarithm of the number of chunks that can be stamped with the batch.
   * @param options Options for creation of postage batch
   * @param options.gasPrice Sets gas price for the transaction that creates the postage batch
   * @param options.label Sets label for the postage batch
   * @throws BeeArgumentError when negative amount or depth is specified
   * @throws TypeError if non-integer value is passed to amount or depth
   */
  async createPostageBatch(amount: NumberString, depth: number, options?: PostageBatchOptions): Promise<BatchId> {
    assertNonNegativeInteger(amount)
    assertNonNegativeInteger(depth)

    if (depth < STAMPS_DEPTH_MIN) {
      throw new BeeArgumentError(`Depth has to be at least ${STAMPS_DEPTH_MIN}`, depth)
    }

    if (depth > STAMPS_DEPTH_MAX) {
      throw new BeeArgumentError(`Depth has to be at most ${STAMPS_DEPTH_MAX}`, depth)
    }

    if (options?.gasPrice) {
      assertNonNegativeInteger(options.gasPrice)
    }

    if (options?.immutableFlag !== undefined) {
      assertBoolean(options.immutableFlag)
    }

    return stamps.createPostageBatch(this.url, amount, depth, options)
  }

  /**
   * Return details for specific postage batch.
   *
   * @param postageBatchId BatchId
   */
  async getPostageBatch(postageBatchId: BatchId | string): Promise<PostageBatch> {
    assertBatchId(postageBatchId)

    return stamps.getPostageBatch(this.url, postageBatchId)
  }

  /**
   * Return all postage batches that has the node available.
   */
  async getAllPostageBatch(): Promise<PostageBatch[]> {
    return stamps.getAllPostageBatches(this.url)
  }

  /*
   * Settlements endpoint
   */

  /**
   * Get amount of sent and received from settlements with a peer
   *
   * @param address  Swarm address of peer
   */
  async getSettlements(address: Address | string): Promise<Settlements> {
    assertAddress(address)

    return settlements.getSettlements(this.url, address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  async getAllSettlements(): Promise<AllSettlements> {
    return settlements.getAllSettlements(this.url)
  }

  /**
   * Get health of node
   */
  async getHealth(): Promise<Health> {
    return status.getHealth(this.url)
  }

  /**
   * Connnects to a node and checks if it is a supported Bee version by the bee-js
   *
   * @returns true if the Bee node version is supported
   */
  async isSupportedVersion(): Promise<boolean> | never {
    return status.isSupportedVersion(this.url)
  }

  /**
   * Get reserve state
   */
  async getReserveState(): Promise<ReserveState> {
    return states.getReserveState(this.url)
  }

  /**
   * Get chain state
   */
  async getChainState(): Promise<ChainState> {
    return states.getChainState(this.url)
  }
}
