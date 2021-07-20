import type { AxiosRequestConfig } from 'axios'
import { Identifier, SingleOwnerChunk } from '../chunk/soc'
import { ChunkReference, FeedUploadOptions } from '../feed'
import { FeedType } from '../feed/type'
import { FeedUpdateOptions, FetchFeedUpdateResponse } from '../modules/feed'
import { Bytes } from '../utils/bytes'
import { BeeError } from '../utils/error'
import { EthAddress, HexEthAddress } from '../utils/eth'
import { HexString } from '../utils/hex'
export * from './debug'

export interface Dictionary<T> {
  [Key: string]: T
}

export const ADDRESS_HEX_LENGTH = 64
export const PUBKEY_HEX_LENGTH = 66
export const BATCH_ID_HEX_LENGTH = 64
export const REFERENCE_HEX_LENGTH = 64
export const ENCRYPTED_REFERENCE_HEX_LENGTH = 128
export const REFERENCE_BYTES_LENGTH = 32
export const ENCRYPTED_REFERENCE_BYTES_LENGTH = 64

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

/**
 * Generic reference that can be either non-encrypted reference which is a hex string of length 64 or encrypted
 * reference which is a hex string of length 128.
 *
 * Encrypted reference consists of two parts. The reference address itself (like non-encrypted reference) and decryption key.
 *
 * @see [Bee docs - Store with Encryption](https://docs.ethswarm.org/docs/access-the-swarm/store-with-encryption)
 */
export type Reference = HexString<typeof REFERENCE_HEX_LENGTH> | HexString<typeof ENCRYPTED_REFERENCE_HEX_LENGTH>
export type PublicKey = HexString<typeof PUBKEY_HEX_LENGTH>

export type Address = HexString<typeof ADDRESS_HEX_LENGTH>

/**
 * BatchId is result of keccak256 hash so 64 hex string without prefix.
 */
export type BatchId = HexString<typeof BATCH_ID_HEX_LENGTH>

/**
 * AddressPrefix is an HexString of length equal or smaller then ADDRESS_HEX_LENGTH.
 * It represents PSS Address Prefix that is used to define address neighborhood that will receive the PSS message.
 */
export type AddressPrefix = HexString

export interface BeeOptions {
  /**
   * Signer object or private key of the Signer in form of either hex string or Uint8Array that will be default signer for the instance.
   */
  signer?: Signer | Uint8Array | string
}

export interface UploadOptions {
  /**
   * Will pin the data locally in the Bee node as well.
   *
   * Locally pinned data is possible to reupload to network if it disappear.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz/post)
   */
  pin?: boolean

  /**
   * Will encrypt the uploaded data and return longer hash which also includes the decryption key.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @see [Bee docs - Store with Encryption](https://docs.ethswarm.org/docs/access-the-swarm/store-with-encryption)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz/post)
   * @see Reference
   */
  encrypt?: boolean

  /**
   * Tags keep track of syncing the data with network. This option allows attach existing Tag UUID to the uploaded data.
   *
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz/post)
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @link Tag
   */
  tag?: number

  /** Alter default options of axios HTTP client */
  axiosOptions?: AxiosRequestConfig
}

export interface FileUploadOptions extends UploadOptions {
  /**
   * Specifies Content-Length for the given data. It is required when uploading with Readable.
   *
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/File)
   */
  size?: number

  /**
   * Specifies given Content-Type so when loaded in browser the file is correctly represented.
   *
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/File)
   */
  contentType?: string
}

export interface CollectionUploadOptions extends UploadOptions {
  /**
   * Default file to be returned when the root hash of collection is accessed.
   *
   * @see [Bee docs - Upload a directory](https://docs.ethswarm.org/docs/access-the-swarm/upload-a-directory)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/File)
   */
  indexDocument?: string

  /**
   * Configure custom error document to be returned when a specified path can not be found in collection.
   *
   * @see [Bee docs - Upload a directory](https://docs.ethswarm.org/docs/access-the-swarm/upload-a-directory)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/File)
   */
  errorDocument?: string
}

export interface UploadHeaders {
  'swarm-pin'?: string
  'swarm-encrypt'?: string
  'swarm-tag'?: string
  'swarm-postage-batch-id'?: string
}

/**
 * Object that contains infromation about progress of upload of data to network.
 *
 * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
 */
export interface Tag {
  /**
   * Number of all chunks that the data will be split into.
   */
  total: number

  /**
   * Number of chunks that is locally stored in the Bee node.
   */
  processed: number

  /**
   * Number of chunks that arrived to their designated destination in the network
   */
  synced: number

  /**
   * Unique identifier
   */
  uid: number

  /**
   * When the upload process started
   */
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
  reference: string
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
  hex(): HexString

  /**
   * Converts the binary data into string which is then parsed into JSON.
   */
  json(): Record<string, unknown>
}

/**
 * Object represents a file and some of its metadata in [[Directory]] object.
 */
export interface CollectionEntry<T> {
  data: T

  /**
   *
   */
  path: string
}

/**
 * Represents Collections
 */
export type Collection<T> = Array<CollectionEntry<T>>

export interface PssSubscription {
  readonly topic: string
  cancel: () => void
}

export interface PssMessageHandler {
  onMessage: (message: Data, subscription: PssSubscription) => void
  onError: (error: BeeError, subscription: PssSubscription) => void
}

export interface BeeGenericResponse {
  message: string
  code: number
}

export interface ReferenceResponse {
  reference: Reference
}

export type HttpMethod = 'get' | 'GET' | 'delete' | 'DELETE' | 'post' | 'POST' | 'patch' | 'PATCH'

export interface BeeRequest {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
}

export interface BeeResponse {
  headers: Record<string, string>
  data: unknown
  status: number
  statusText?: string
  request: BeeRequest
}

/*********************************************************
 * Writers and Readers interfaces
 */

export const TOPIC_BYTES_LENGTH = 32
export const TOPIC_HEX_LENGTH = 64

/**
 * Hex string of length 64 chars without prefix that specifies topics for feed.
 */
export type Topic = HexString<typeof TOPIC_HEX_LENGTH>

/**
 * FeedReader is an interface for downloading feed updates
 */
export interface FeedReader {
  readonly type: FeedType
  readonly owner: HexEthAddress
  readonly topic: Topic
  /**
   * Download the latest feed update
   */
  download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse>
}

export interface JsonFeedOptions {
  /**
   * Valid only for `get` action, where either this `address` or `signer` has
   * to be specified.
   */
  address?: EthAddress | Uint8Array | string

  /**
   * Custom Signer object or private key in either binary or hex form.
   * This required for `set` action, and optional for `get` although
   * if not specified for `get` then `address` option has to be specified.
   */
  signer?: Signer | Uint8Array | string
  type?: FeedType
}

/**
 * FeedWriter is an interface for updating feeds
 */
export interface FeedWriter extends FeedReader {
  /**
   * Upload a new feed update
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param reference The reference to be stored in the new update
   * @param options   Additional options like `at`
   *
   * @returns Reference that points at Single Owner Chunk that contains the new update and pointer to the updated chunk reference.
   */
  upload(
    postageBatchId: string | BatchId,
    reference: ChunkReference | Reference,
    options?: FeedUploadOptions,
  ): Promise<Reference>
}

/**
 * Interface for downloading single owner chunks
 */
export interface SOCReader {
  /**
   * Downloads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   */
  download: (identifier: Identifier) => Promise<SingleOwnerChunk>
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
    postageBatchId: string | BatchId,
    identifier: Identifier,
    data: Uint8Array,
    options?: UploadOptions,
  ) => Promise<Reference>
}

/**
 * Interface representing Postage stamp batch.
 */
export interface PostageBatch {
  batchID: BatchId
  utilization: number
  usable: boolean
  label: '' | string
  depth: number
  amount: string
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
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
  gasPrice?: NumberString
  immutableFlag?: boolean
}

/**
 * With this type a number should be represented in a string
 */
export type NumberString = FlavoredType<string, 'NumberString'>

/*********************************************************
 * Ethereum compatible signing interfaces and definitions
 */

export const SIGNATURE_HEX_LENGTH = 130
export const SIGNATURE_BYTES_LENGTH = 65

export type Signature = Bytes<typeof SIGNATURE_BYTES_LENGTH>
export type PrivateKeyBytes = Bytes<32>

/**
 * Signing function that takes digest in Uint8Array  to be signed that has helpers to convert it
 * conveniently into other types like hex-string (non prefix).
 * Result of the signing can be returned either in Uint8Array or hex string form.
 *
 * @see Data
 */
type SyncSigner = (digest: Data) => Signature | HexString<typeof SIGNATURE_HEX_LENGTH> | string
type AsyncSigner = (digest: Data) => Promise<Signature | HexString<typeof SIGNATURE_HEX_LENGTH> | string>

/**
 * Interface for implementing Ethereum compatible signing.
 *
 * In order to be compatible with Ethereum and its signing method `personal_sign`, the data
 * that are passed to sign() function should be prefixed with: `\x19Ethereum Signed Message:\n${data.length}`, hashed
 * and only then signed.
 * If you are wrapping another signer tool/library (like Metamask or some other Ethereum wallet), you might not have
 * to do this prefixing manually if you use the `personal_sign` method. Check documentation of the tool!
 * If you are writing your own storage for keys, then you have to prefix the data manually otherwise the Bee node
 * will reject the chunks signed by you!
 *
 * For example see the hashWithEthereumPrefix() function.
 *
 * @property sign     The sign function that can be sync or async. This function takes non-prefixed data. See above.
 * @property address  The ethereum address of the signer in bytes.
 * @see hashWithEthereumPrefix
 */
export type Signer = {
  sign: SyncSigner | AsyncSigner
  address: EthAddress
}

/**
 * These type are used to create new nominal types
 *
 * See https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/
 */
export type BrandedType<Type, Name> = Type & { __tag__: Name }

export type BrandedString<Name> = BrandedType<string, Name>

export type FlavoredType<Type, Name> = Type & { __tag__?: Name }

// JSON typings
// by @indiescripter at https://github.com/microsoft/TypeScript/issues/1897#issuecomment-338650717
export type AnyJson = boolean | number | string | null | JsonArray | JsonMap
interface JsonMap {
  [key: string]: AnyJson
}
type JsonArray = Array<AnyJson>
