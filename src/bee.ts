import { Objects } from 'cafe-utility'
import { Chunk, makeContentAddressedChunk, unmarshalContentAddressedChunk } from './chunk/cac'
import { SingleOwnerChunk, makeSOCAddress, makeSingleOwnerChunk, unmarshalSingleOwnerChunk } from './chunk/soc'
import { Balance } from './modules/balance'
import type { BeeContext } from './modules/context'
import { Cheque } from './modules/cheque'
import { Chequebook } from './modules/chequebook'
import { Connectivity } from './modules/connectivity'
import { Settlement } from './modules/settlement'
import { Stake } from './modules/stake'
import { Stamp } from './modules/stamp'
import { Storage } from './modules/storage'
import { Status } from './modules/status'
import { Wallet } from './modules/wallet'
import { Transaction } from './modules/transaction'
import { postEnvelope } from './api/envelope'
import { Chunk as ChunkNamespace } from './modules/chunk'
import { Collection } from './modules/collection'
import { Data } from './modules/data'
import { File as FileNamespace } from './modules/file'
import { Feed } from './modules/feed'
import { Soc } from './modules/soc'
import { Grantee } from './modules/grantee'
import { Messaging } from './modules/messaging'
import { Pin } from './modules/pin'
import { rchash } from './api/rchash'
import { Tag } from './modules/tag'
import type { BeeOptions, BeeRequestOptions, EnvelopeWithBatchId } from './types'
import { Bytes } from './utils/bytes'
import { BeeRequestOptionsSchema } from './utils/schema'
import { BatchId, EthAddress, Identifier, PrivateKey, Reference, Span } from './utils/typed-bytes'
import { assertBeeUrl, stripLastSlash } from './utils/url'

/**
 * The main component that abstracts operations available on the Bee API.
 *
 * Instantiate with `new Bee(url, options)` where `url` is the Bee node URL and `options` are optional parameters.
 *
 * @example
 * const bee = new Bee('http://localhost:1633')
 */
export class Bee {
  /**
   * Bee node API URL.
   *
   * @example
   * `http://localhost:1633`
   */
  public readonly url: string

  /**
   * Default signer (a private key) used for signing.
   *
   * Mainly used in single-owner chunk (SOC) related operations, and consequently in feeds.
   *
   * If not provided, methods such as `makeFeedWriter` and `makeSOCWriter`
   * must be provided with a private key in their respective function calls.
   */
  public readonly signer?: PrivateKey

  /**
   * Network on which the Bee node is running.
   *
   * This is currently used to determine block time for postage batch time-to-live (TTL) calculations.
   * The block time for `gnosis` is `5` seconds, and for `sepolia` it is `15` seconds.
   *
   * @default 'gnosis'
   */
  public readonly network: 'gnosis' | 'sepolia'

  /**
   * Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  private readonly requestOptions: BeeRequestOptions

  /**
   * @param url URL on which is the main API of Bee node exposed
   * @param options
   *
   * @example
   * const bee = new Bee('http://localhost:1633')
   */
  constructor(url: string, options?: BeeOptions) {
    assertBeeUrl(url)

    this.url = stripLastSlash(url)

    if (options?.signer) {
      this.signer = new PrivateKey(options.signer)
    }

    this.network = options?.network ?? 'gnosis'

    this.requestOptions = {
      baseURL: this.url,
      timeout: options?.timeout ?? 0,
      headers: options?.headers,
      onRequest: options?.onRequest,
      httpAgent: options?.httpAgent,
      httpsAgent: options?.httpsAgent,
    }

    // Facade handed to each module (namespace) class, exposing only the shared
    // state and helpers they need — without widening the public `bee.` surface.
    const context: BeeContext = {
      getRequestOptionsForCall: requestOptions => this.getRequestOptionsForCall(requestOptions),
      url: this.url,
      signer: this.signer,
      network: this.network,
      bee: this,
    }

    this.balance = new Balance(context)
    this.settlement = new Settlement(context)
    this.transaction = new Transaction(context)
    this.stake = new Stake(context)
    this.connectivity = new Connectivity(context)
    this.status = new Status(context)
    this.wallet = new Wallet(context)
    this.stamp = new Stamp(context)
    this.storage = new Storage(context)
    this.chequebook = new Chequebook(context)
    this.cheque = new Cheque(context)
    this.tag = new Tag(context)
    this.pin = new Pin(context)
    this.grantee = new Grantee(context)
    this.messaging = new Messaging(context)
    this.feed = new Feed(context)
    this.soc = new Soc(context)
    this.data = new Data(context)
    this.chunk = new ChunkNamespace(context)
    this.file = new FileNamespace(context)
    this.collection = new Collection(context)
  }

  /**
   * SWAP balance operations. Related to the bandwidth incentives and the chequebook.
   */
  public readonly balance: Balance

  /**
   * Settlement operations. Related to the bandwidth incentives and the chequebook.
   */
  public readonly settlement: Settlement

  /**
   * Pending transaction operations for the Bee node's transaction queue.
   */
  public readonly transaction: Transaction

  /**
   * Staking operations.
   */
  public readonly stake: Stake

  /**
   * Peer, topology and network connectivity operations.
   */
  public readonly connectivity: Connectivity

  /**
   * Node status, health, version and chain/reserve state operations.
   */
  public readonly status: Status

  /**
   * Node wallet operations (balances and external withdrawals).
   */
  public readonly wallet: Wallet

  /**
   * Low-level postage batch (stamp) operations.
   */
  public readonly stamp: Stamp

  /**
   * Ergonomic storage operations expressed in terms of size and duration.
   */
  public readonly storage: Storage

  /**
   * Chequebook contract operations (address, balance, deposit, withdraw).
   */
  public readonly chequebook: Chequebook

  /**
   * Cheque operations (last cheques and cashouts).
   */
  public readonly cheque: Cheque

  /**
   * Tag operations for tracking upload and synchronization progress.
   */
  public readonly tag: Tag

  /**
   * Local pinning operations.
   */
  public readonly pin: Pin

  /**
   * Grantee (access control) operations.
   */
  public readonly grantee: Grantee

  /**
   * Messaging protocols — PSS and GSOC.
   */
  public readonly messaging: Messaging

  /**
   * Feed operations.
   */
  public readonly feed: Feed

  /**
   * Single owner chunk (SOC) reader/writer operations.
   */
  public readonly soc: Soc

  /**
   * Raw data operations backed by the `/bytes` endpoint.
   */
  public readonly data: Data

  /**
   * Chunk operations backed by the `/chunks` endpoint.
   */
  public readonly chunk: ChunkNamespace

  /**
   * Single-file operations backed by the `/bzz` endpoint.
   */
  public readonly file: FileNamespace

  /**
   * Collection (multi-file) operations backed by the `/bzz` endpoint.
   */
  public readonly collection: Collection

  /**
   * Creates a Content Addressed Chunk.
   *
   * To be uploaded with the {@link uploadChunk} method.
   *
   * Payload size must be between 1 and 4096 bytes.
   *
   * @param rawPayload Data to be stored in the chunk. If the data is a string, it will be converted to UTF-8 bytes.
   * @param span       Optional span for the chunk. If not provided, it will be set to the length of the payload.
   */
  makeContentAddressedChunk(rawPayload: Bytes | Uint8Array | string, span?: Span | bigint): Chunk {
    return makeContentAddressedChunk(rawPayload, span)
  }

  /**
   * Attempts to unmarshal arbitrary data into a Content Addressed Chunk.
   * Throws an error if the data is not a valid CAC.
   *
   * @param data The chunk data (`span` and `payload`)
   */
  unmarshalContentAddressedChunk(data: Bytes | Uint8Array): Chunk {
    return unmarshalContentAddressedChunk(data)
  }

  /**
   * Creates a Single Owner Chunk.
   *
   * To be uploaded with the {@link uploadChunk} method.
   *
   * Identical to chaining `makeContentAddressedChunk` and `toSingleOwnerChunk`.
   *
   * Payload size must be between 1 and 4096 bytes.
   *
   * @param address     Address of the Content Addressed Chunk
   * @param span        Span of the Content Addressed Chunk
   * @param payload     Payload of the Content Addressed Chunk
   * @param identifier  The identifier of the chunk
   * @param signer      The signer interface for signing the chunk
   */
  makeSingleOwnerChunk(
    address: Reference,
    span: Span,
    payload: Bytes,
    identifier: Identifier | Uint8Array | string,
    signer: PrivateKey | Uint8Array | string,
  ): SingleOwnerChunk {
    return makeSingleOwnerChunk(address, span, payload, identifier, signer)
  }

  /**
   * Calculates the address of a Single Owner Chunk based on its identifier and owner address.
   *
   * @param identifier
   * @param address
   */
  calculateSingleOwnerChunkAddress(identifier: Identifier, address: EthAddress): Reference {
    return makeSOCAddress(identifier, address)
  }

  /**
   * Attempts to unmarshal arbitrary data into a Single Owner Chunk.
   * Throws an error if the data is not a valid SOC.
   *
   * @param data    The chunk data
   * @param address The address of the single owner chunk
   *
   * @returns a single owner chunk or throws error
   */
  unmarshalSingleOwnerChunk(data: Bytes | Uint8Array, address: Reference | Uint8Array | string): SingleOwnerChunk {
    return unmarshalSingleOwnerChunk(data, address)
  }

  /**
   * Creates the postage batch signature for a specific chunk address.
   *
   * This is for advanced usage, where a pre-signed chunk can be uploaded
   * through a different Bee node.
   *
   * @param postageBatchId
   * @param reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @example
   * const envelope = await bee.createEnvelope(batchId, chunk.address)
   * await bee.chunk.upload(envelope, chunk)
   *
   * @returns
   */
  async createEnvelope(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<EnvelopeWithBatchId> {
    postageBatchId = new BatchId(postageBatchId)
    reference = new Reference(reference)

    return postEnvelope(this.getRequestOptionsForCall(requestOptions), postageBatchId, reference)
  }

  /**
   * Gets reserve commitment hash duration seconds.
   *
   * To be able to participe in the storage incentives and not get frozen, this should
   * ideally run under 5 minutes.
   *
   * This is a CPU intensice operation, as roughly 2^22 chunks are hashed in the process.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @example
   * const addresses = await bee.connectivity.getNodeAddresses()
   * const topology = await bee.connectivity.getTopology()
   * const result = await bee.rchash(topology.depth, addresses.overlay.toHex(), addresses.overlay.toHex())
   * // result is a number of seconds
   */
  async rchash(depth: number, anchor1: string, anchor2: string, requestOptions?: BeeRequestOptions): Promise<number> {
    return rchash(this.getRequestOptionsForCall(requestOptions), depth, anchor1, anchor2)
  }

  /**
   * Merges per-call request options with the instance defaults.
   *
   * Stays `protected`; module namespaces reach it only through the {@link BeeContext}
   * facade they are constructed with, so it never widens the public `bee.` surface.
   */
  protected getRequestOptionsForCall(requestOptions?: BeeRequestOptions): BeeRequestOptions {
    if (requestOptions) {
      requestOptions = BeeRequestOptionsSchema.parse(requestOptions)
    }

    return requestOptions ? Objects.deepMerge2(this.requestOptions, requestOptions) : this.requestOptions
  }
}
