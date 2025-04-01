import { Optional } from 'cafe-utility'
import type { SingleOwnerChunk } from '../chunk/soc'
import type { FeedUploadOptions } from '../feed'
import type { FeedPayloadResult, FeedReferenceResult, FeedUpdateOptions } from '../modules/feed'
import { Bytes } from '../utils/bytes'
import { Duration } from '../utils/duration'
import type { BeeError } from '../utils/error'
import { Size } from '../utils/size'
import {
  BatchId,
  EthAddress,
  Identifier,
  PrivateKey,
  PublicKey,
  Reference,
  Topic,
  TransactionId,
} from '../utils/typed-bytes'

export * from './debug'

export const SECTION_SIZE = 32
export const BRANCHES = 128
export const CHUNK_SIZE = SECTION_SIZE * BRANCHES

export const PSS_TARGET_HEX_LENGTH_MAX = 4

/**
 * Minimal depth that can be used for creation of postage batch
 */
export const STAMPS_DEPTH_MIN = 17

/**
 * Maximal depth that can be used for creation of postage batch
 */
export const STAMPS_DEPTH_MAX = 255

export const TAGS_LIMIT_MIN = 1
export const TAGS_LIMIT_MAX = 1000

export const FEED_INDEX_HEX_LENGTH = 16

export type BeeRequestOptions = {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  onRequest?: (request: BeeRequest) => void
  httpAgent?: unknown
  httpsAgent?: unknown
  endlesslyRetry?: boolean
}

export interface BeeOptions extends BeeRequestOptions {
  /**
   * Signer object or private key of the Signer in form of either hex string or Uint8Array that will be default signer for the instance.
   */
  signer?: PrivateKey | Uint8Array | string
  /**
   * Default gnosis when unspecified.
   */
  network?: 'gnosis' | 'sepolia'
}

export interface GranteesResult {
  status: number
  statusText: string
  ref: Reference
  historyref: Reference
}

export interface GetGranteesResult {
  status: number
  statusText: string
  grantees: PublicKey[]
}

/**
 * Result of upload calls.
 */
export interface UploadResult {
  /**
   * Reference of the uploaded data
   */
  reference: Reference

  /**
   * Automatically created tag's UID.
   */
  tagUid?: number

  /**
   * History address of the uploaded data with ACT.
   */
  historyAddress: Optional<Reference>
}

export interface UploadOptions {
  /**
   * If set to true, an ACT will be created for the uploaded data.
   */
  act?: boolean

  actHistoryAddress?: Reference | Uint8Array | string

  /**
   * Will pin the data locally in the Bee node as well.
   *
   * Locally pinned data is possible to reupload to network if it disappear.
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  pin?: boolean

  /**
   * Will encrypt the uploaded data and return longer hash which also includes the decryption key.
   *
   * @see [Bee docs - Store with Encryption](https://docs.ethswarm.org/docs/develop/access-the-swarm/store-with-encryption)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   * @see Reference
   */
  encrypt?: boolean

  /**
   * Tags keep track of syncing the data with network. This option allows attach existing Tag UUID to the uploaded data.
   *
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @link Tag
   */
  tag?: number

  /**
   * Determines if the uploaded data should be sent to the network immediately (eq. deferred=false) or in a deferred fashion (eq. deferred=true).
   *
   * With deferred style client uploads all the data to Bee node first and only then Bee node starts push the data to network itself. The progress of this upload can be tracked with tags.
   * With non-deferred style client uploads the data to Bee which immediately starts pushing the data to network. The request is only finished once all the data was pushed through the Bee node to the network.
   *
   * In future there will be move to the non-deferred style and even the support for deferred upload will be removed from Bee itself.
   *
   * @default true
   */
  deferred?: boolean
}

/**
 * Add redundancy to the data being uploaded so that downloaders can download it with better UX.
 * 0 value is default and does not add any redundancy to the file.
 */
export enum RedundancyLevel {
  OFF = 0,
  MEDIUM = 1,
  STRONG = 2,
  INSANE = 3,
  PARANOID = 4,
}

export interface RedundantUploadOptions extends UploadOptions {
  redundancyLevel?: RedundancyLevel
}

/**
 * Specify the retrieve strategy on redundant data.
 * The possible values are NONE, DATA, PROX and RACE.
 * Strategy NONE means no prefetching takes place.
 * Strategy DATA means only data chunks are prefetched.
 * Strategy PROX means only chunks that are close to the node are prefetched.
 * Strategy RACE means all chunks are prefetched: n data chunks and k parity chunks. The first n chunks to arrive are used to reconstruct the file.
 * Multiple strategies can be used in a fallback cascade if the swarm redundancy fallback mode is set to true.
 * The default strategy is NONE, DATA, falling back to PROX, falling back to RACE
 */
export enum RedundancyStrategy {
  NONE = 0,
  DATA = 1,
  PROX = 2,
  RACE = 3,
}

export interface DownloadOptions {
  /**
   * Specify the retrieve strategy on redundant data.
   */
  redundancyStrategy?: RedundancyStrategy
  /**
   * Specify if the retrieve strategies (chunk prefetching on redundant data) are used in a fallback cascade. The default is true.
   */
  fallback?: boolean
  /**
   * Specify the timeout for chunk retrieval. The default is 30 seconds.
   */
  timeoutMs?: number

  actPublisher?: PublicKey | Uint8Array | string

  actHistoryAddress?: Reference | Uint8Array | string

  actTimestamp?: string | number
}

export interface FileUploadOptions extends UploadOptions {
  /**
   * Specifies Content-Length for the given data. It is required when uploading with Readable.
   *
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  size?: number

  /**
   * Specifies given Content-Type so when loaded in browser the file is correctly represented.
   *
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  contentType?: string

  redundancyLevel?: RedundancyLevel
}

export interface CollectionUploadOptions extends UploadOptions {
  /**
   * Default file to be returned when the root hash of collection is accessed.
   *
   * @see [Bee docs - Upload a directory](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download#upload-a-directory)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  indexDocument?: string

  /**
   * Configure custom error document to be returned when a specified path can not be found in collection.
   *
   * @see [Bee docs - Upload a directory](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download#upload-a-directory)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  errorDocument?: string

  redundancyLevel?: RedundancyLevel
}

export interface UploadHeaders {
  'swarm-act'?: string
  'swarm-pin'?: string
  'swarm-encrypt'?: string
  'swarm-tag'?: string
  'swarm-postage-batch-id'?: string
}

/**
 * Object that contains infromation about progress of upload of data to network.
 *
 * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
 */
export interface Tag {
  split: number
  seen: number
  stored: number
  sent: number
  synced: number
  uid: number
  address: string
  startedAt: string
}

export interface AllTagsOptions {
  limit?: number
  offset?: number
}

export interface FileHeaders {
  name?: string
  tagUid?: number
  contentType?: string
}

export interface FileData<T> extends FileHeaders {
  data: T
}

export interface Pin {
  reference: Reference
}

export interface ReferenceInformation {
  contentLength: number
}

/**
 * Helper interface that adds utility functions
 * to work more conveniently with bytes in normal
 * user scenarios.
 *
 * Concretely: text(), hex(), json()
 */
export interface Data extends Uint8Array {
  /**
   * Converts the binary data using UTF-8 decoding into string.
   */
  text(): string

  /**
   * Converts the binary data into hex-string.
   */
  hex(): string

  /**
   * Converts the binary data into string which is then parsed into JSON.
   */
  json(): Record<string, unknown>
}

/**
 * Object represents a file and some of its metadata in [[Directory]] object.
 */
export interface CollectionEntry {
  path: string
  size: number
  file?: File
  fsPath?: string
}

/**
 * Represents Collections
 */
export type Collection = Array<CollectionEntry>

export interface PssSubscription {
  readonly topic: Topic
  cancel: () => void
}

export interface PssMessageHandler {
  onMessage: (message: Bytes, subscription: PssSubscription) => void
  onError: (error: BeeError, subscription: PssSubscription) => void
}

export interface GsocSubscription {
  readonly address: EthAddress
  cancel: () => void
}

export interface GsocMessageHandler {
  onMessage: (message: Bytes, subscription: GsocSubscription) => void
  onError: (error: BeeError, subscription: GsocSubscription) => void
}

export interface ReferenceResponse {
  reference: Reference
}

export type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PATCH' | 'PUT'

export type HookCallback<V> = (value: V) => void | Promise<void>

export interface BeeRequest {
  url: string
  method: string
  headers?: Record<string, string>
  params?: Record<string, unknown>
}

export interface BeeResponse {
  headers: Record<string, string>
  status: number
  statusText?: string
  request: BeeRequest
}

/**
 * FeedReader is an interface for downloading feed updates
 */
export interface FeedReader {
  readonly owner: EthAddress
  readonly topic: Topic

  /**
   * @deprecated Use `downloadReference` or `downloadPayload` instead to disambiguate how the data should be interpreted.
   */
  download(options?: FeedUpdateOptions): Promise<FeedPayloadResult>

  /**
   * Downloads the feed update (latest if no index is specified) and returns it as a reference.
   */
  downloadReference(options?: FeedUpdateOptions): Promise<FeedReferenceResult>

  /**
   * Downloads the feed update (latest if no index is specified) and returns it as a payload.
   */
  downloadPayload(options?: FeedUpdateOptions): Promise<FeedPayloadResult>
}

/**
 * FeedWriter is an interface for updating feeds
 */
export interface FeedWriter extends FeedReader {
  /**
   * Upload a new feed update
   *
   * @deprecated Use `uploadReference` or `uploadPayload` instead to disambiguate how the data should be interpreted.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param reference The reference to be stored in the new update
   * @param options   Additional options like `at`
   *
   * @returns UpdateResult that points at Single Owner Chunk that contains the new update and pointer to the updated chunk reference.
   */
  upload(
    postageBatchId: string | BatchId,
    reference: Reference | string | Uint8Array,
    options?: FeedUploadOptions,
  ): Promise<UploadResult>

  uploadReference(
    postageBatchId: string | BatchId,
    reference: Reference | string | Uint8Array,
    options?: FeedUploadOptions,
  ): Promise<UploadResult>

  uploadPayload(
    postageBatchId: string | BatchId,
    payload: Uint8Array | string,
    options?: FeedUploadOptions,
  ): Promise<UploadResult>
}

/**
 * Interface for downloading single owner chunks
 */
export interface SOCReader {
  readonly owner: EthAddress
  /**
   * Downloads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   */
  download: (identifier: Identifier | Uint8Array | string) => Promise<SingleOwnerChunk>
}

/**
 * Interface for downloading and uploading single owner chunks
 */
export interface SOCWriter extends SOCReader {
  /**
   * Uploads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   * @param data        The chunk payload data
   * @param options     Upload options
   */
  upload: (
    stamp: BatchId | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    data: Uint8Array,
    options?: UploadOptions,
  ) => Promise<UploadResult>
}

export interface GlobalPostageBatch {
  batchID: BatchId
  value: NumberString
  start: number
  owner: EthAddress
  depth: number
  bucketDepth: number
  immutable: boolean
  batchTTL: number
}

export interface PostageBatch {
  batchID: BatchId
  /**
   * Represents how much of the batch is used up.
   *
   * Max utilization = `2 ** (depth - bucketDepth)`
   *
   * Since the smallest depth is 17, and one batch has 65,536 buckets, and one chunk is 4,096 bytes,
   * the 512MB theoretical max size for the smallest stamp comes from `2 * 65536 * 4096 = 512MB`
   */
  utilization: number
  usable: boolean
  label: string
  depth: number
  amount: NumberString
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
  /**
   * Estimated time until the batch expires
   */
  duration: Duration
  /**
   * A floating point number from 0 to 1, where 0 is no usage, 1 is full usage.
   */
  usage: number
  /**
   * Human readable usage text, like "50%" or "100%", no fractions
   */
  usageText: string
  /**
   * Effective size
   */
  size: Size
  /**
   * Estimated remaining size
   */
  remainingSize: Size
  /**
   * Theoretical size in bytes
   */
  theoreticalSize: Size
}

export interface BatchBucket {
  bucketID: number
  collisions: number
}

export interface PostageBatchBuckets {
  depth: number
  bucketDepth: number
  bucketUpperBound: number
  buckets: BatchBucket[]
}

export interface TransactionInfo {
  transactionHash: TransactionId
  to: string
  nonce: number
  gasPrice: NumberString
  gasLimit: number
  data: string
  created: string
  description: string
  value: string
}

/**
 * Options for creation of postage batch
 */
export interface PostageBatchOptions {
  /**
   * Sets label for the postage batch
   */
  label?: string

  /**
   * Sets gas price in Wei for the transaction that creates the postage batch
   */
  gasPrice?: NumberString | string | bigint

  /**
   * Controls whether data can be overwritten that was uploaded with this postage batch.
   */
  immutableFlag?: boolean

  /**
   * The returned Promise will await until the purchased Postage Batch is usable.
   * In other word, it has to have enough block confirmations that Bee pronounce it usable.
   * When turned on, this significantly prolongs the creation of postage batch!
   *
   * If you plan to use the stamp right away for some action with Bee (like uploading using this stamp) it is
   * highly recommended to use this option, otherwise you might get errors "stamp not usable" from Bee.
   *
   * @default true
   */
  waitForUsable?: boolean

  /**
   * When waiting for the postage stamp to become usable, this specify the timeout for the waiting.
   * Default: 120s
   */
  waitForUsableTimeout?: number
}

export interface Envelope {
  issuer: Uint8Array
  index: Uint8Array
  timestamp: Uint8Array
  signature: Uint8Array
}

export interface EnvelopeWithBatchId extends Envelope {
  batchId: BatchId
}

/**
 * With this type a number should be represented in a string
 */
export type NumberString = string & { __numberString: never }
