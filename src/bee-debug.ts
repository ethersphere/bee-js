import * as connectivity from './modules/debug/connectivity'
import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as settlements from './modules/debug/settlements'
import * as status from './modules/debug/status'
import * as states from './modules/debug/states'
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
  Settlements,
  AllSettlements,
  RemovePeerResponse,
  Topology,
  PingResponse,
  Health,
  NodeAddresses,
  ReserveState,
  ChainState,
  NumberString,
  ExtendedTag,
  PostageBatchBuckets,
  DebugPostageBatch,
  Ky,
} from './types'
import { BeeArgumentError } from './utils/error'
import { assertBeeUrl, stripLastSlash } from './utils/url'
import { assertAddress, assertBatchId, assertBoolean, assertNonNegativeInteger, isTag } from './utils/type'
import {
  BatchId,
  BeeOptions,
  CashoutOptions,
  PostageBatchOptions,
  STAMPS_DEPTH_MAX,
  STAMPS_DEPTH_MIN,
  Tag,
} from './types'
import * as tag from './modules/debug/tag'
import * as stamps from './modules/debug/stamps'
import type { Options as KyOptions } from 'ky-universal'
import { makeDefaultKy, wrapRequestClosure, wrapResponseClosure } from './utils/http'

/**
 * The BeeDebug class provides a way of interacting with the Bee debug APIs based on the provided url
 *
 * @param url URL of a running Bee node
 */
export class BeeDebug {
  public readonly url: string

  private readonly ky: Ky

  constructor(url: string, options?: BeeOptions) {
    assertBeeUrl(url)

    // Remove last slash if present, as our endpoint strings starts with `/...`
    // which could lead to double slash in URL to which Bee responds with
    // unnecessary redirects.
    this.url = stripLastSlash(url)

    const kyOptions: KyOptions = {
      prefixUrl: this.url,
      timeout: false,
      hooks: {
        beforeRequest: [],
        afterResponse: [],
      },
    }

    if (options?.defaultHeaders) {
      kyOptions.headers = options.defaultHeaders
    }

    if (options?.onRequest) {
      kyOptions.hooks?.beforeRequest?.push(wrapRequestClosure(options.onRequest))
    }

    if (options?.onResponse) {
      kyOptions.hooks?.afterResponse?.push(wrapResponseClosure(options.onResponse))
    }

    this.ky = makeDefaultKy(kyOptions)
  }

  async getNodeAddresses(): Promise<NodeAddresses> {
    return connectivity.getNodeAddresses(this.ky)
  }

  async getBlocklist(): Promise<Peer[]> {
    return connectivity.getBlocklist(this.ky)
  }

  /**
   * Retrieve tag extended information from Bee node
   *
   * @param tagUid UID or tag object to be retrieved
   * @throws TypeError if tagUid is in not correct format
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags/{uid}`](https://docs.ethswarm.org/debug-api/#tag/Tag)
   *
   */
  async retrieveExtendedTag(tagUid: number | Tag): Promise<ExtendedTag> {
    if (isTag(tagUid)) {
      tagUid = tagUid.uid
    } else if (typeof tagUid === 'number') {
      assertNonNegativeInteger(tagUid, 'UID')
    } else {
      throw new TypeError('tagUid has to be either Tag or a number (UID)!')
    }

    return tag.retrieveExtendedTag(this.ky, tagUid)
  }

  /**
   * Get list of peers for this node
   */
  async getPeers(): Promise<Peer[]> {
    return connectivity.getPeers(this.ky)
  }

  async removePeer(peer: string | Address): Promise<RemovePeerResponse> {
    assertAddress(peer)

    return connectivity.removePeer(this.ky, peer)
  }

  async getTopology(): Promise<Topology> {
    return connectivity.getTopology(this.ky)
  }

  async pingPeer(peer: string | Address): Promise<PingResponse> {
    assertAddress(peer)

    return connectivity.pingPeer(this.ky, peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  async getAllBalances(): Promise<BalanceResponse> {
    return balance.getAllBalances(this.ky)
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Swarm address of peer
   */
  async getPeerBalance(address: Address | string): Promise<PeerBalance> {
    assertAddress(address)

    return balance.getPeerBalance(this.ky, address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  async getPastDueConsumptionBalances(): Promise<BalanceResponse> {
    return balance.getPastDueConsumptionBalances(this.ky)
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Swarm address of peer
   */
  async getPastDueConsumptionPeerBalance(address: Address | string): Promise<PeerBalance> {
    assertAddress(address)

    return balance.getPastDueConsumptionPeerBalance(this.ky, address)
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
    return chequebook.getChequebookAddress(this.ky)
  }

  /**
   * Get the balance of the chequebook
   */
  async getChequebookBalance(): Promise<ChequebookBalanceResponse> {
    return chequebook.getChequebookBalance(this.ky)
  }

  /**
   * Get last cheques for all peers
   */
  async getLastCheques(): Promise<LastChequesResponse> {
    return chequebook.getLastCheques(this.ky)
  }

  /**
   * Get last cheques for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastChequesForPeer(address: Address | string): Promise<LastChequesForPeerResponse> {
    assertAddress(address)

    return chequebook.getLastChequesForPeer(this.ky, address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastCashoutAction(address: Address | string): Promise<LastCashoutActionResponse> {
    assertAddress(address)

    return chequebook.getLastCashoutAction(this.ky, address)
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

    return chequebook.cashoutLastCheque(this.ky, address, options)
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

    return chequebook.depositTokens(this.ky, amount, gasPrice)
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

    return chequebook.withdrawTokens(this.ky, amount, gasPrice)
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

    return settlements.getSettlements(this.ky, address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  async getAllSettlements(): Promise<AllSettlements> {
    return settlements.getAllSettlements(this.ky)
  }

  /**
   * Get health of node
   */
  async getHealth(): Promise<Health> {
    return status.getHealth(this.ky)
  }

  /**
   * Connnects to a node and checks if it is a supported Bee version by the bee-js
   *
   * @returns true if the Bee node version is supported
   */
  async isSupportedVersion(): Promise<boolean> | never {
    return status.isSupportedVersion(this.ky)
  }

  /**
   * Get reserve state
   */
  async getReserveState(): Promise<ReserveState> {
    return states.getReserveState(this.ky)
  }

  /**
   * Get chain state
   */
  async getChainState(): Promise<ChainState> {
    return states.getChainState(this.ky)
  }

  /**
   * Creates new postage batch from the funds that the node has available in its Ethereum account.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param amount Amount that represents the value per chunk, has to be greater or equal zero.
   * @param depth Logarithm of the number of chunks that can be stamped with the batch.
   * @param options Options for creation of postage batch
   * @throws BeeArgumentError when negative amount or depth is specified
   * @throws TypeError if non-integer value is passed to amount or depth
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `POST /stamps`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{amount}~1{depth}/post)
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

    return stamps.createPostageBatch(this.ky, amount, depth, options)
  }

  /**
   * Return details for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{id}/get)
   */
  async getPostageBatch(postageBatchId: BatchId | string): Promise<DebugPostageBatch> {
    assertBatchId(postageBatchId)

    return stamps.getPostageBatch(this.ky, postageBatchId)
  }

  /**
   * Return detailed information related to buckets for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}/buckets`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{id}~1buckets/get)
   */
  async getPostageBatchBuckets(postageBatchId: BatchId | string): Promise<PostageBatchBuckets> {
    assertBatchId(postageBatchId)

    return stamps.getPostageBatchBuckets(this.ky, postageBatchId)
  }

  /**
   * Return all postage batches that has the node available.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps/get)
   */
  async getAllPostageBatch(): Promise<DebugPostageBatch[]> {
    return stamps.getAllPostageBatches(this.ky)
  }
}
