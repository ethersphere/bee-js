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

export const capacityBreakpoints = {
  ENCRYPTION_OFF: {
    [RedundancyLevel.OFF]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '44.70 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '6.66 MB', batchDepth: 18, utilizationRate: '0.61%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '112.06 MB', batchDepth: 19, utilizationRate: '5.09%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '687.62 MB', batchDepth: 20, utilizationRate: '15.65%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '2.60 GB', batchDepth: 21, utilizationRate: '30.27%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '7.73 GB', batchDepth: 22, utilizationRate: '44.99%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '19.94 GB', batchDepth: 23, utilizationRate: '58.03%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '47.06 GB', batchDepth: 24, utilizationRate: '68.48%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '105.51 GB', batchDepth: 25, utilizationRate: '76.77%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '227.98 GB', batchDepth: 26, utilizationRate: '82.94%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '476.68 GB', batchDepth: 27, utilizationRate: '86.71%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '993.65 GB', batchDepth: 28, utilizationRate: '88.37%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '2.04 TB', batchDepth: 29, utilizationRate: '92.88%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '4.17 TB', batchDepth: 30, utilizationRate: '94.81%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '8.45 TB', batchDepth: 31, utilizationRate: '96.06%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '17.07 TB', batchDepth: 32, utilizationRate: '97.01%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '34.36 TB', batchDepth: 33, utilizationRate: '97.65%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '69.04 TB', batchDepth: 34, utilizationRate: '98.11%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '138.54 TB', batchDepth: 35, utilizationRate: '98.44%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '277.72 TB', batchDepth: 36, utilizationRate: '98.67%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '556.35 TB', batchDepth: 37, utilizationRate: '98.83%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '1.11 PB', batchDepth: 38, utilizationRate: '98.91%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '2.23 PB', batchDepth: 39, utilizationRate: '98.96%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '4.46 PB', batchDepth: 40, utilizationRate: '98.98%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '8.93 PB', batchDepth: 41, utilizationRate: '99.11%' },
    ],
    [RedundancyLevel.MEDIUM]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '41.56 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '6.19 MB', batchDepth: 18, utilizationRate: '0.57%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '104.18 MB', batchDepth: 19, utilizationRate: '4.73%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '639.27 MB', batchDepth: 20, utilizationRate: '14.54%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '2.41 GB', batchDepth: 21, utilizationRate: '28.11%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '7.18 GB', batchDepth: 22, utilizationRate: '41.79%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '18.54 GB', batchDepth: 23, utilizationRate: '53.95%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '43.75 GB', batchDepth: 24, utilizationRate: '63.66%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '98.09 GB', batchDepth: 25, utilizationRate: '71.37%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '211.95 GB', batchDepth: 26, utilizationRate: '77.11%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '443.16 GB', batchDepth: 27, utilizationRate: '80.61%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '923.78 GB', batchDepth: 28, utilizationRate: '82.16%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '1.90 TB', batchDepth: 29, utilizationRate: '86.30%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '3.88 TB', batchDepth: 30, utilizationRate: '88.14%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '7.86 TB', batchDepth: 31, utilizationRate: '89.26%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '15.87 TB', batchDepth: 32, utilizationRate: '90.21%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '31.94 TB', batchDepth: 33, utilizationRate: '90.77%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '64.19 TB', batchDepth: 34, utilizationRate: '91.22%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '128.80 TB', batchDepth: 35, utilizationRate: '91.52%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '258.19 TB', batchDepth: 36, utilizationRate: '91.73%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '517.23 TB', batchDepth: 37, utilizationRate: '91.88%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '1.04 PB', batchDepth: 38, utilizationRate: '91.95%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '2.07 PB', batchDepth: 39, utilizationRate: '92.00%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '4.15 PB', batchDepth: 40, utilizationRate: '92.15%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '8.30 PB', batchDepth: 41, utilizationRate: '92.14%' },
    ],
    [RedundancyLevel.STRONG]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '37.37 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '5.57 MB', batchDepth: 18, utilizationRate: '0.51%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '93.68 MB', batchDepth: 19, utilizationRate: '4.25%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '574.81 MB', batchDepth: 20, utilizationRate: '13.07%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '2.17 GB', batchDepth: 21, utilizationRate: '25.26%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '6.46 GB', batchDepth: 22, utilizationRate: '37.58%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '16.67 GB', batchDepth: 23, utilizationRate: '48.50%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '39.34 GB', batchDepth: 24, utilizationRate: '57.24%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '88.20 GB', batchDepth: 25, utilizationRate: '64.17%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '190.58 GB', batchDepth: 26, utilizationRate: '69.33%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '398.47 GB', batchDepth: 27, utilizationRate: '72.48%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '830.63 GB', batchDepth: 28, utilizationRate: '73.85%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '1.71 TB', batchDepth: 29, utilizationRate: '77.59%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '3.49 TB', batchDepth: 30, utilizationRate: '79.27%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '7.07 TB', batchDepth: 31, utilizationRate: '80.34%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '14.27 TB', batchDepth: 32, utilizationRate: '81.12%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '28.72 TB', batchDepth: 33, utilizationRate: '81.63%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '57.71 TB', batchDepth: 34, utilizationRate: '82.01%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '115.81 TB', batchDepth: 35, utilizationRate: '82.29%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '232.16 TB', batchDepth: 36, utilizationRate: '82.48%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '465.07 TB', batchDepth: 37, utilizationRate: '82.61%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '931.23 TB', batchDepth: 38, utilizationRate: '82.67%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '1.86 PB', batchDepth: 39, utilizationRate: '82.71%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '3.73 PB', batchDepth: 40, utilizationRate: '82.78%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '7.46 PB', batchDepth: 41, utilizationRate: '82.79%' },
    ],
    [RedundancyLevel.INSANE]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '33.88 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '5.05 MB', batchDepth: 18, utilizationRate: '0.46%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '84.92 MB', batchDepth: 19, utilizationRate: '3.86%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '521.09 MB', batchDepth: 20, utilizationRate: '11.85%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '1.97 GB', batchDepth: 21, utilizationRate: '22.90%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '5.86 GB', batchDepth: 22, utilizationRate: '34.09%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '15.11 GB', batchDepth: 23, utilizationRate: '43.97%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '35.66 GB', batchDepth: 24, utilizationRate: '51.90%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '79.96 GB', batchDepth: 25, utilizationRate: '58.18%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '172.77 GB', batchDepth: 26, utilizationRate: '62.85%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '361.23 GB', batchDepth: 27, utilizationRate: '65.70%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '753.00 GB', batchDepth: 28, utilizationRate: '66.95%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '1.55 TB', batchDepth: 29, utilizationRate: '70.38%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '3.16 TB', batchDepth: 30, utilizationRate: '71.92%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '6.41 TB', batchDepth: 31, utilizationRate: '72.85%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '12.93 TB', batchDepth: 32, utilizationRate: '73.53%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '26.04 TB', batchDepth: 33, utilizationRate: '74.01%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '52.32 TB', batchDepth: 34, utilizationRate: '74.35%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '104.99 TB', batchDepth: 35, utilizationRate: '74.60%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '210.46 TB', batchDepth: 36, utilizationRate: '74.77%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '421.61 TB', batchDepth: 37, utilizationRate: '74.89%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '844.20 TB', batchDepth: 38, utilizationRate: '74.94%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '1.69 PB', batchDepth: 39, utilizationRate: '74.98%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '3.38 PB', batchDepth: 40, utilizationRate: '75.03%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '6.77 PB', batchDepth: 41, utilizationRate: '75.10%' },
    ],
    [RedundancyLevel.PARANOID]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '13.27 kB', batchDepth: 17, utilizationRate: '0.00%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '1.98 MB', batchDepth: 18, utilizationRate: '0.18%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '33.27 MB', batchDepth: 19, utilizationRate: '1.51%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '204.14 MB', batchDepth: 20, utilizationRate: '4.64%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '771.13 MB', batchDepth: 21, utilizationRate: '8.75%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '2.29 GB', batchDepth: 22, utilizationRate: '13.34%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '5.92 GB', batchDepth: 23, utilizationRate: '17.22%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '13.97 GB', batchDepth: 24, utilizationRate: '20.33%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '31.32 GB', batchDepth: 25, utilizationRate: '22.79%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '67.68 GB', batchDepth: 26, utilizationRate: '24.62%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '141.51 GB', batchDepth: 27, utilizationRate: '25.74%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '294.99 GB', batchDepth: 28, utilizationRate: '26.23%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '606.90 GB', batchDepth: 29, utilizationRate: '27.56%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '1.24 TB', batchDepth: 30, utilizationRate: '28.15%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '2.51 TB', batchDepth: 31, utilizationRate: '28.54%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '5.07 TB', batchDepth: 32, utilizationRate: '28.82%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '10.20 TB', batchDepth: 33, utilizationRate: '28.99%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '20.50 TB', batchDepth: 34, utilizationRate: '29.13%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '41.13 TB', batchDepth: 35, utilizationRate: '29.22%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '82.45 TB', batchDepth: 36, utilizationRate: '29.29%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '165.17 TB', batchDepth: 37, utilizationRate: '29.34%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '330.72 TB', batchDepth: 38, utilizationRate: '29.37%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '661.97 TB', batchDepth: 39, utilizationRate: '29.39%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '1.32 PB', batchDepth: 40, utilizationRate: '29.41%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '2.65 PB', batchDepth: 41, utilizationRate: '29.43%' },
    ],
  },

  ENCRYPTION_ON: {
    [RedundancyLevel.OFF]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '44.35 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '6.61 MB', batchDepth: 18, utilizationRate: '0.60%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '111.18 MB', batchDepth: 19, utilizationRate: '5.05%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '682.21 MB', batchDepth: 20, utilizationRate: '15.52%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '2.58 GB', batchDepth: 21, utilizationRate: '30.04%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '7.67 GB', batchDepth: 22, utilizationRate: '44.62%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '19.78 GB', batchDepth: 23, utilizationRate: '57.56%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '46.69 GB', batchDepth: 24, utilizationRate: '67.93%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '104.68 GB', batchDepth: 25, utilizationRate: '76.16%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '226.19 GB', batchDepth: 26, utilizationRate: '82.29%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '472.93 GB', batchDepth: 27, utilizationRate: '86.02%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '985.83 GB', batchDepth: 28, utilizationRate: '87.66%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '2.03 TB', batchDepth: 29, utilizationRate: '92.25%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '4.14 TB', batchDepth: 30, utilizationRate: '94.21%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '8.39 TB', batchDepth: 31, utilizationRate: '95.37%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '16.93 TB', batchDepth: 32, utilizationRate: '96.22%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '34.09 TB', batchDepth: 33, utilizationRate: '96.88%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '68.50 TB', batchDepth: 34, utilizationRate: '97.34%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '137.45 TB', batchDepth: 35, utilizationRate: '97.67%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '275.53 TB', batchDepth: 36, utilizationRate: '97.89%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '551.97 TB', batchDepth: 37, utilizationRate: '98.05%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '1.11 PB', batchDepth: 38, utilizationRate: '98.13%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '2.21 PB', batchDepth: 39, utilizationRate: '98.18%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '4.43 PB', batchDepth: 40, utilizationRate: '98.36%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '8.86 PB', batchDepth: 41, utilizationRate: '98.37%' },
    ],
    [RedundancyLevel.MEDIUM]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '40.89 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '6.09 MB', batchDepth: 18, utilizationRate: '0.56%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '102.49 MB', batchDepth: 19, utilizationRate: '4.65%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '628.91 MB', batchDepth: 20, utilizationRate: '14.30%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '2.38 GB', batchDepth: 21, utilizationRate: '27.68%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '7.07 GB', batchDepth: 22, utilizationRate: '41.15%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '18.24 GB', batchDepth: 23, utilizationRate: '53.09%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '43.04 GB', batchDepth: 24, utilizationRate: '62.63%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '96.50 GB', batchDepth: 25, utilizationRate: '70.21%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '208.52 GB', batchDepth: 26, utilizationRate: '75.86%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '435.98 GB', batchDepth: 27, utilizationRate: '79.30%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '908.81 GB', batchDepth: 28, utilizationRate: '80.82%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '1.87 TB', batchDepth: 29, utilizationRate: '84.98%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '3.81 TB', batchDepth: 30, utilizationRate: '86.67%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '7.73 TB', batchDepth: 31, utilizationRate: '87.84%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '15.61 TB', batchDepth: 32, utilizationRate: '88.74%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '31.43 TB', batchDepth: 33, utilizationRate: '89.34%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '63.15 TB', batchDepth: 34, utilizationRate: '89.74%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '126.71 TB', batchDepth: 35, utilizationRate: '90.03%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '254.01 TB', batchDepth: 36, utilizationRate: '90.24%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '508.85 TB', batchDepth: 37, utilizationRate: '90.39%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '1.02 PB', batchDepth: 38, utilizationRate: '90.47%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '2.04 PB', batchDepth: 39, utilizationRate: '90.51%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '4.08 PB', batchDepth: 40, utilizationRate: '90.64%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '8.17 PB', batchDepth: 41, utilizationRate: '90.65%' },
    ],
    [RedundancyLevel.STRONG]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '36.73 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '5.47 MB', batchDepth: 18, utilizationRate: '0.50%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '92.07 MB', batchDepth: 19, utilizationRate: '4.18%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '564.95 MB', batchDepth: 20, utilizationRate: '12.85%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '2.13 GB', batchDepth: 21, utilizationRate: '24.86%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '6.35 GB', batchDepth: 22, utilizationRate: '36.97%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '16.38 GB', batchDepth: 23, utilizationRate: '47.67%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '38.66 GB', batchDepth: 24, utilizationRate: '56.26%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '86.69 GB', batchDepth: 25, utilizationRate: '63.07%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '187.31 GB', batchDepth: 26, utilizationRate: '68.14%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '391.64 GB', batchDepth: 27, utilizationRate: '71.24%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '816.39 GB', batchDepth: 28, utilizationRate: '72.59%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '1.68 TB', batchDepth: 29, utilizationRate: '76.34%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '3.43 TB', batchDepth: 30, utilizationRate: '77.89%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '6.94 TB', batchDepth: 31, utilizationRate: '78.86%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '14.02 TB', batchDepth: 32, utilizationRate: '79.71%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '28.23 TB', batchDepth: 33, utilizationRate: '80.23%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '56.72 TB', batchDepth: 34, utilizationRate: '80.60%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '113.82 TB', batchDepth: 35, utilizationRate: '80.88%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '228.18 TB', batchDepth: 36, utilizationRate: '81.06%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '457.10 TB', batchDepth: 37, utilizationRate: '81.20%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '915.26 TB', batchDepth: 38, utilizationRate: '81.26%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '1.83 PB', batchDepth: 39, utilizationRate: '81.30%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '3.67 PB', batchDepth: 40, utilizationRate: '81.43%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '7.34 PB', batchDepth: 41, utilizationRate: '81.45%' },
    ],
    [RedundancyLevel.INSANE]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '33.26 kB', batchDepth: 17, utilizationRate: '0.01%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '4.96 MB', batchDepth: 18, utilizationRate: '0.45%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '83.38 MB', batchDepth: 19, utilizationRate: '3.79%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '511.65 MB', batchDepth: 20, utilizationRate: '11.64%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '1.93 GB', batchDepth: 21, utilizationRate: '22.52%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '5.75 GB', batchDepth: 22, utilizationRate: '33.50%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '14.84 GB', batchDepth: 23, utilizationRate: '43.19%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '35.02 GB', batchDepth: 24, utilizationRate: '50.96%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '78.51 GB', batchDepth: 25, utilizationRate: '57.12%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '169.64 GB', batchDepth: 26, utilizationRate: '61.71%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '354.69 GB', batchDepth: 27, utilizationRate: '64.52%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '739.37 GB', batchDepth: 28, utilizationRate: '65.74%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '1.52 TB', batchDepth: 29, utilizationRate: '69.15%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '3.10 TB', batchDepth: 30, utilizationRate: '70.56%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '6.29 TB', batchDepth: 31, utilizationRate: '71.48%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '12.70 TB', batchDepth: 32, utilizationRate: '72.18%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '25.57 TB', batchDepth: 33, utilizationRate: '72.67%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '51.37 TB', batchDepth: 34, utilizationRate: '73.00%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '103.08 TB', batchDepth: 35, utilizationRate: '73.24%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '206.65 TB', batchDepth: 36, utilizationRate: '73.42%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '413.98 TB', batchDepth: 37, utilizationRate: '73.54%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '828.91 TB', batchDepth: 38, utilizationRate: '73.59%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '1.66 PB', batchDepth: 39, utilizationRate: '73.62%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '3.32 PB', batchDepth: 40, utilizationRate: '73.72%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '6.64 PB', batchDepth: 41, utilizationRate: '73.74%' },
    ],
    [RedundancyLevel.PARANOID]: [
      { theoreticalVolume: '536.87 MB', effectiveVolume: '13.17 kB', batchDepth: 17, utilizationRate: '0.00%' },
      { theoreticalVolume: '1.07 GB', effectiveVolume: '1.96 MB', batchDepth: 18, utilizationRate: '0.18%' },
      { theoreticalVolume: '2.15 GB', effectiveVolume: '33.01 MB', batchDepth: 19, utilizationRate: '1.50%' },
      { theoreticalVolume: '4.29 GB', effectiveVolume: '202.53 MB', batchDepth: 20, utilizationRate: '4.61%' },
      { theoreticalVolume: '8.59 GB', effectiveVolume: '765.05 MB', batchDepth: 21, utilizationRate: '8.68%' },
      { theoreticalVolume: '17.18 GB', effectiveVolume: '2.28 GB', batchDepth: 22, utilizationRate: '13.27%' },
      { theoreticalVolume: '34.36 GB', effectiveVolume: '5.87 GB', batchDepth: 23, utilizationRate: '17.08%' },
      { theoreticalVolume: '68.72 GB', effectiveVolume: '13.86 GB', batchDepth: 24, utilizationRate: '20.17%' },
      { theoreticalVolume: '137.44 GB', effectiveVolume: '31.08 GB', batchDepth: 25, utilizationRate: '22.61%' },
      { theoreticalVolume: '274.88 GB', effectiveVolume: '67.15 GB', batchDepth: 26, utilizationRate: '24.43%' },
      { theoreticalVolume: '549.76 GB', effectiveVolume: '140.40 GB', batchDepth: 27, utilizationRate: '25.54%' },
      { theoreticalVolume: '1.10 TB', effectiveVolume: '292.67 GB', batchDepth: 28, utilizationRate: '26.03%' },
      { theoreticalVolume: '2.20 TB', effectiveVolume: '602.12 GB', batchDepth: 29, utilizationRate: '27.35%' },
      { theoreticalVolume: '4.40 TB', effectiveVolume: '1.23 TB', batchDepth: 30, utilizationRate: '27.94%' },
      { theoreticalVolume: '8.80 TB', effectiveVolume: '2.49 TB', batchDepth: 31, utilizationRate: '28.32%' },
      { theoreticalVolume: '17.59 TB', effectiveVolume: '5.03 TB', batchDepth: 32, utilizationRate: '28.60%' },
      { theoreticalVolume: '35.18 TB', effectiveVolume: '10.12 TB', batchDepth: 33, utilizationRate: '28.77%' },
      { theoreticalVolume: '70.37 TB', effectiveVolume: '20.34 TB', batchDepth: 34, utilizationRate: '28.91%' },
      { theoreticalVolume: '140.74 TB', effectiveVolume: '40.80 TB', batchDepth: 35, utilizationRate: '29.00%' },
      { theoreticalVolume: '281.47 TB', effectiveVolume: '81.80 TB', batchDepth: 36, utilizationRate: '29.06%' },
      { theoreticalVolume: '562.95 TB', effectiveVolume: '163.87 TB', batchDepth: 37, utilizationRate: '29.11%' },
      { theoreticalVolume: '1.13 PB', effectiveVolume: '328.11 TB', batchDepth: 38, utilizationRate: '29.14%' },
      { theoreticalVolume: '2.25 PB', effectiveVolume: '656.76 TB', batchDepth: 39, utilizationRate: '29.16%' },
      { theoreticalVolume: '4.50 PB', effectiveVolume: '1.31 PB', batchDepth: 40, utilizationRate: '29.18%' },
      { theoreticalVolume: '9.01 PB', effectiveVolume: '2.63 PB', batchDepth: 41, utilizationRate: '29.19%' },
    ],
  },
}

