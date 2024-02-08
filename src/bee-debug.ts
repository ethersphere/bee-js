import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as connectivity from './modules/debug/connectivity'
import * as settlements from './modules/debug/settlements'
import * as stake from './modules/debug/stake'
import * as states from './modules/debug/states'
import * as status from './modules/debug/status'
import * as transactions from './modules/debug/transactions'

import { Objects, System } from 'cafe-utility'
import * as stamps from './modules/debug/stamps'
import * as tag from './modules/debug/tag'
import type {
  Address,
  AllSettlements,
  BalanceResponse,
  BeeRequestOptions,
  BeeVersions,
  ChainState,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  DebugStatus,
  ExtendedTag,
  Health,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NodeAddresses,
  NodeInfo,
  NumberString,
  Peer,
  PeerBalance,
  PingResponse,
  PostageBatch,
  PostageBatchBuckets,
  RedistributionState,
  RemovePeerResponse,
  ReserveState,
  Settlements,
  Topology,
  TransactionHash,
  TransactionInfo,
  WalletBalance,
} from './types'
import {
  BatchId,
  BeeOptions,
  CashoutOptions,
  PostageBatchOptions,
  STAMPS_DEPTH_MAX,
  STAMPS_DEPTH_MIN,
  Tag,
  TransactionOptions,
} from './types'
import { BeeArgumentError, BeeError } from './utils/error'
import {
  assertAddress,
  assertBatchId,
  assertCashoutOptions,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertPostageBatchOptions,
  assertRequestOptions,
  assertTransactionHash,
  assertTransactionOptions,
  isTag,
} from './utils/type'
import { assertBeeUrl, stripLastSlash } from './utils/url'

export class BeeDebug {
  /**
   * URL on which is the Debug API of Bee node exposed
   */
  public readonly url: string

  /**
   * Ky instance that defines connection to Bee node
   * @private
   */
  private readonly requestOptions: BeeRequestOptions

  constructor(url: string, options?: BeeOptions) {
    assertBeeUrl(url)

    // Remove last slash if present, as our endpoint strings starts with `/...`
    // which could lead to double slash in URL to which Bee responds with
    // unnecessary redirects.
    this.url = stripLastSlash(url)

    this.requestOptions = {
      baseURL: this.url,
      timeout: options?.timeout ?? false,
      headers: options?.headers,
      onRequest: options?.onRequest,
      adapter: options?.adapter,
    }
  }

  async getNodeAddresses(options?: BeeRequestOptions): Promise<NodeAddresses> {
    assertRequestOptions(options)

    return connectivity.getNodeAddresses(this.getRequestOptionsForCall(options))
  }

  async getBlocklist(options?: BeeRequestOptions): Promise<Peer[]> {
    assertRequestOptions(options)

    return connectivity.getBlocklist(this.getRequestOptionsForCall(options))
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
  async retrieveExtendedTag(tagUid: number | Tag, options?: BeeRequestOptions): Promise<ExtendedTag> {
    assertRequestOptions(options)

    if (isTag(tagUid)) {
      tagUid = tagUid.uid
    } else if (typeof tagUid === 'number') {
      assertNonNegativeInteger(tagUid, 'UID')
    } else {
      throw new TypeError('tagUid has to be either Tag or a number (UID)!')
    }

    return tag.retrieveExtendedTag(this.getRequestOptionsForCall(options), tagUid)
  }

  /**
   * Get list of peers for this node
   */
  async getPeers(options?: BeeRequestOptions): Promise<Peer[]> {
    assertRequestOptions(options)

    return connectivity.getPeers(this.getRequestOptionsForCall(options))
  }

  async removePeer(peer: string | Address, options?: BeeRequestOptions): Promise<RemovePeerResponse> {
    assertRequestOptions(options)
    assertAddress(peer)

    return connectivity.removePeer(this.getRequestOptionsForCall(options), peer)
  }

  async getTopology(options?: BeeRequestOptions): Promise<Topology> {
    assertRequestOptions(options)

    return connectivity.getTopology(this.getRequestOptionsForCall(options))
  }

  async pingPeer(peer: string | Address, options?: BeeRequestOptions): Promise<PingResponse> {
    assertRequestOptions(options)
    assertAddress(peer)

    return connectivity.pingPeer(this.getRequestOptionsForCall(options), peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  async getAllBalances(options?: BeeRequestOptions): Promise<BalanceResponse> {
    assertRequestOptions(options)

    return balance.getAllBalances(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Swarm address of peer
   */
  async getPeerBalance(address: Address | string, options?: BeeRequestOptions): Promise<PeerBalance> {
    assertRequestOptions(options)
    assertAddress(address)

    return balance.getPeerBalance(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  async getPastDueConsumptionBalances(options?: BeeRequestOptions): Promise<BalanceResponse> {
    assertRequestOptions(options)

    return balance.getPastDueConsumptionBalances(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Swarm address of peer
   */
  async getPastDueConsumptionPeerBalance(address: Address | string, options?: BeeRequestOptions): Promise<PeerBalance> {
    assertRequestOptions(options)
    assertAddress(address)

    return balance.getPastDueConsumptionPeerBalance(this.getRequestOptionsForCall(options), address)
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
  async getChequebookAddress(options?: BeeRequestOptions): Promise<ChequebookAddressResponse> {
    assertRequestOptions(options)

    return chequebook.getChequebookAddress(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the balance of the chequebook
   */
  async getChequebookBalance(options?: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
    assertRequestOptions(options)

    return chequebook.getChequebookBalance(this.getRequestOptionsForCall(options))
  }

  /**
   * Get last cheques for all peers
   */
  async getLastCheques(options?: BeeRequestOptions): Promise<LastChequesResponse> {
    assertRequestOptions(options)

    return chequebook.getLastCheques(this.getRequestOptionsForCall(options))
  }

  /**
   * Get last cheques for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastChequesForPeer(
    address: Address | string,
    options?: BeeRequestOptions,
  ): Promise<LastChequesForPeerResponse> {
    assertRequestOptions(options)
    assertAddress(address)

    return chequebook.getLastChequesForPeer(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastCashoutAction(
    address: Address | string,
    options?: BeeRequestOptions,
  ): Promise<LastCashoutActionResponse> {
    assertRequestOptions(options)
    assertAddress(address)

    return chequebook.getLastCashoutAction(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Cashout the last cheque for the peer
   *
   * @param address  Swarm address of peer
   * @param options
   * @param options.gasPrice Gas price for the cashout transaction in WEI
   * @param options.gasLimit Gas limit for the cashout transaction in WEI
   */
  async cashoutLastCheque(
    address: string | Address,
    options?: CashoutOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<string> {
    assertCashoutOptions(options)
    assertAddress(address)

    return chequebook.cashoutLastCheque(this.getRequestOptionsForCall(requestOptions), address, options)
  }

  /**
   * Deposit tokens from overlay address into chequebook
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async depositTokens(
    amount: number | NumberString,
    gasPrice?: NumberString,
    options?: BeeRequestOptions,
  ): Promise<string> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.depositTokens(this.getRequestOptionsForCall(options), amount, gasPrice)
  }

  /**
   * Withdraw tokens from the chequebook to the overlay address
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async withdrawTokens(
    amount: number | NumberString,
    gasPrice?: NumberString,
    options?: BeeRequestOptions,
  ): Promise<string> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.withdrawTokens(this.getRequestOptionsForCall(options), amount, gasPrice)
  }

  /*
   * Settlements endpoint
   */

  /**
   * Get amount of sent and received from settlements with a peer
   *
   * @param address  Swarm address of peer
   */
  async getSettlements(address: Address | string, options?: BeeRequestOptions): Promise<Settlements> {
    assertRequestOptions(options)
    assertAddress(address)

    return settlements.getSettlements(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  async getAllSettlements(options?: BeeRequestOptions): Promise<AllSettlements> {
    assertRequestOptions(options)

    return settlements.getAllSettlements(this.getRequestOptionsForCall(options))
  }

  /**
   * Get status of node
   */
  async getStatus(options?: BeeRequestOptions): Promise<DebugStatus> {
    assertRequestOptions(options)

    return status.getDebugStatus(this.getRequestOptionsForCall(options))
  }

  /**
   * Get health of node
   */
  async getHealth(options?: BeeRequestOptions): Promise<Health> {
    assertRequestOptions(options)

    return status.getHealth(this.getRequestOptionsForCall(options))
  }

  /**
   * Get readiness of node
   */
  async getReadiness(options?: BeeRequestOptions): Promise<boolean> {
    assertRequestOptions(options)

    return status.getReadiness(this.getRequestOptionsForCall(options))
  }

  /**
   * Get mode information of node
   */
  async getNodeInfo(options?: BeeRequestOptions): Promise<NodeInfo> {
    assertRequestOptions(options)

    return status.getNodeInfo(this.getRequestOptionsForCall(options))
  }

  /**
   * Connnects to a node and checks if it is a supported Bee version by the bee-js
   *
   * @returns true if the Bee node version is supported
   * @deprecated Use `BeeDebug.isSupportedExactVersion()` instead
   */
  async isSupportedVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Connects to a node and checks if its version matches with the one that bee-js supports.
   *
   * Be aware that this is the most strict version check and most probably
   * you will want to use more relaxed API-versions based checks like
   * `BeeDebug.isSupportedApiVersion()`, `BeeDebug.isSupportedMainApiVersion()` or `BeeDebug.isSupportedDebugApiVersion()`
   * based on your use-case.
   *
   * @param options
   */
  async isSupportedExactVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedExactVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Connects to a node and checks if its main's API version matches with the one that bee-js supports.
   *
   * This is useful if you are not using `BeeDebug` class (for anything else then this check)
   * and want to make sure about compatibility.
   *
   * @param options
   */
  async isSupportedMainApiVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedMainApiVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Connects to a node and checks if its Debug API version matches with the one that bee-js supports.
   *
   * This is useful if you are not using `Bee` class in your application and want to make sure
   * about compatibility.
   *
   * @param options
   */
  async isSupportedDebugApiVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedDebugApiVersion(this.getRequestOptionsForCall(options))
  }

  /**
   *
   * Connects to a node and checks if its Main and Debug API versions matches with the one that bee-js supports.
   *
   * This should be the main way how to check compatibility for your app and Bee node.
   *
   * @param options
   */
  async isSupportedApiVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedDebugApiVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Returns object with all versions specified by the connected Bee node (properties prefixed with `bee*`)
   * and versions that bee-js supports (properties prefixed with `supported*`).
   *
   * @param options
   */
  async getVersions(options?: BeeRequestOptions): Promise<BeeVersions> | never {
    assertRequestOptions(options)

    return status.getVersions(this.getRequestOptionsForCall(options))
  }

  /**
   * Get reserve state
   */
  async getReserveState(options?: BeeRequestOptions): Promise<ReserveState> {
    assertRequestOptions(options)

    return states.getReserveState(this.getRequestOptionsForCall(options))
  }

  /**
   * Get chain state
   */
  async getChainState(options?: BeeRequestOptions): Promise<ChainState> {
    assertRequestOptions(options)

    return states.getChainState(this.getRequestOptionsForCall(options))
  }

  /**
   * Get wallet balances for xDai and BZZ of the Bee node
   *
   * @param options
   */
  async getWalletBalance(options?: BeeRequestOptions): Promise<WalletBalance> {
    assertRequestOptions(options)

    return states.getWalletBalance(this.getRequestOptionsForCall(options))
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
  async createPostageBatch(
    amount: NumberString,
    depth: number,
    options?: PostageBatchOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    assertPostageBatchOptions(options)
    assertPositiveInteger(amount)
    assertNonNegativeInteger(depth)

    if (depth < STAMPS_DEPTH_MIN) {
      throw new BeeArgumentError(`Depth has to be at least ${STAMPS_DEPTH_MIN}`, depth)
    }

    if (depth > STAMPS_DEPTH_MAX) {
      throw new BeeArgumentError(`Depth has to be at most ${STAMPS_DEPTH_MAX}`, depth)
    }

    const stamp = await stamps.createPostageBatch(this.getRequestOptionsForCall(requestOptions), amount, depth, options)

    if (options?.waitForUsable !== false) {
      await this.waitForUsablePostageStamp(stamp, options?.waitForUsableTimeout)
    }

    return stamp
  }

  /**
   * Topup a fresh amount of BZZ to given Postage Batch.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param postageBatchId Batch ID
   * @param amount Amount to be added to the batch
   * @param options Request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1topup~1{id}~1{amount}/patch)
   */
  async topUpBatch(postageBatchId: BatchId | string, amount: NumberString, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount, 'Amount')
    assertBatchId(postageBatchId)

    await stamps.topUpBatch(this.getRequestOptionsForCall(options), postageBatchId, amount)
  }

  /**
   * Dilute given Postage Batch with new depth (that has to be bigger then the original depth), which allows
   * the Postage Batch to be used for more chunks.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param postageBatchId Batch ID
   * @param depth Amount to be added to the batch
   * @param options Request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1topup~1{id}~1{amount}/patch)
   */
  async diluteBatch(postageBatchId: BatchId | string, depth: number, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertNonNegativeInteger(depth, 'Depth')
    assertBatchId(postageBatchId)

    await stamps.diluteBatch(this.getRequestOptionsForCall(options), postageBatchId, depth)
  }

  /**
   * Return details for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{id}/get)
   */
  async getPostageBatch(postageBatchId: BatchId | string, options?: BeeRequestOptions): Promise<PostageBatch> {
    assertRequestOptions(options)
    assertBatchId(postageBatchId)

    return stamps.getPostageBatch(this.getRequestOptionsForCall(options), postageBatchId)
  }

  /**
   * Return detailed information related to buckets for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}/buckets`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{id}~1buckets/get)
   */
  async getPostageBatchBuckets(
    postageBatchId: BatchId | string,
    options?: BeeRequestOptions,
  ): Promise<PostageBatchBuckets> {
    assertRequestOptions(options)
    assertBatchId(postageBatchId)

    return stamps.getPostageBatchBuckets(this.getRequestOptionsForCall(options), postageBatchId)
  }

  /**
   * Return all postage batches that has the node available.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps/get)
   */
  async getAllPostageBatch(options?: BeeRequestOptions): Promise<PostageBatch[]> {
    assertRequestOptions(options)

    return stamps.getAllPostageBatches(this.getRequestOptionsForCall(options))
  }

  /**
   * Return all globally available postage batches.
   */
  async getAllGlobalPostageBatch(options?: BeeRequestOptions): Promise<PostageBatch[]> {
    assertRequestOptions(options)

    return stamps.getGlobalPostageBatches(this.getRequestOptionsForCall(options))
  }

  /**
   * Return lists of all current pending transactions that the Bee made
   */
  async getAllPendingTransactions(options?: BeeRequestOptions): Promise<TransactionInfo[]> {
    assertRequestOptions(options)

    return transactions.getAllTransactions(this.getRequestOptionsForCall(options))
  }

  /**
   * Return transaction information for specific transaction
   * @param transactionHash
   */
  async getPendingTransaction(
    transactionHash: TransactionHash | string,
    options?: BeeRequestOptions,
  ): Promise<TransactionInfo> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    return transactions.getTransaction(this.getRequestOptionsForCall(options), transactionHash)
  }

  /**
   * Rebroadcast already created transaction.
   * This is mainly needed when your transaction fall off mempool from other reason is not incorporated into block.
   *
   * @param transactionHash
   */
  async rebroadcastPendingTransaction(
    transactionHash: TransactionHash | string,
    options?: BeeRequestOptions,
  ): Promise<TransactionHash> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    return transactions.rebroadcastTransaction(this.getRequestOptionsForCall(options), transactionHash)
  }

  /**
   * Cancel currently pending transaction
   * @param transactionHash
   * @param gasPrice
   */
  async cancelPendingTransaction(
    transactionHash: TransactionHash | string,
    gasPrice?: NumberString,
    options?: BeeRequestOptions,
  ): Promise<TransactionHash> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return transactions.cancelTransaction(this.getRequestOptionsForCall(options), transactionHash, gasPrice)
  }

  /**
   * Gets the staked amount of BZZ (in PLUR unit) as number string.
   *
   * @param options
   */
  async getStake(options?: BeeRequestOptions): Promise<NumberString> {
    assertRequestOptions(options)

    return stake.getStake(this.getRequestOptionsForCall(options))
  }

  /**
   * Deposits given amount of BZZ token (in PLUR unit).
   *
   * Be aware that staked BZZ tokens can **not** be withdrawn.
   *
   * @param amount Amount of BZZ token (in PLUR unit) to be staked. Minimum is 100_000_000_000_000_000 PLUR (10 BZZ).
   * @param options
   */
  async depositStake(
    amount: NumberString,
    options?: TransactionOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    assertRequestOptions(options)
    assertTransactionOptions(options)

    await stake.stake(this.getRequestOptionsForCall(requestOptions), amount, options)
  }

  /**
   * Get current status of node in redistribution game
   *
   * @param options
   */
  async getRedistributionState(options?: BeeRequestOptions): Promise<RedistributionState> {
    assertRequestOptions(options)

    return stake.getRedistributionState(this.getRequestOptionsForCall(options))
  }

  private async waitForUsablePostageStamp(id: BatchId, timeout = 240_000): Promise<void> {
    const TIME_STEP = 2_000
    for (let time = 0; time < timeout; time += TIME_STEP) {
      try {
        const stamp = await this.getPostageBatch(id)

        if (stamp.usable) {
          return
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || ''
        if (!message.includes('batch not usable')) {
          throw error
        }
      }

      await System.sleepMillis(TIME_STEP)
    }

    throw new BeeError('Timeout on waiting for postage stamp to become usable')
  }

  private getRequestOptionsForCall(options?: BeeRequestOptions): BeeRequestOptions {
    return options ? Objects.deepMerge2(this.requestOptions, options) : this.requestOptions
  }
}
