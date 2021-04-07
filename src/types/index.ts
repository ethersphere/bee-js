import { BeeError } from '../utils/error'
import type { AxiosRequestConfig } from 'axios'
import { HexString } from '../utils/hex'
import { Bytes } from '../utils/bytes'
import { EthAddress, HexEthAddress } from '../utils/eth'
import { Identifier, SingleOwnerChunk } from '../chunk/soc'
import { FeedType } from '../feed/type'
import { FeedUpdateOptions, FetchFeedUpdateResponse } from '../modules/feed'
import { ChunkReference, FeedUploadOptions } from '../feed'
export * from './debug'

export interface Dictionary<T> {
  [Key: string]: T
}

export const REFERENCE_HEX_LENGTH = 64
export const ENCRYPTED_REFERENCE_HEX_LENGTH = 128
export const REFERENCE_BYTES_LENGTH = 32
export const ENCRYPTED_REFERENCE_BYTES_LENGTH = 64

export type Reference = HexString<typeof REFERENCE_HEX_LENGTH> | HexString<typeof ENCRYPTED_REFERENCE_HEX_LENGTH>
export type PublicKey = string

export type Address = string
export type AddressPrefix = Address

export interface BeeOptions {
  signer?: Signer | Uint8Array | string
}

export interface UploadOptions {
  pin?: boolean
  encrypt?: boolean
  tag?: number
  /** alter default options of axios HTTP client */
  axiosOptions?: AxiosRequestConfig
}

export interface FileUploadOptions extends UploadOptions {
  size?: number
  contentType?: string
}

export interface CollectionUploadOptions extends UploadOptions {
  indexDocument?: string
  errorDocument?: string
}

export interface DownloadOptions {
  timeout?: number
}

export interface UploadHeaders {
  'swarm-pin'?: string
  'swarm-encrypt'?: string
  'swarm-tag'?: string
}

export interface Tag {
  total: number
  processed: number
  synced: number
  uid: number
  startedAt: string
}

export interface FileHeaders {
  name?: string
  tagUid?: number
  contentType?: string
}

export interface FileData<T> extends FileHeaders {
  data: T
}

/**
 * Helper interface that adds utility functions
 * to work more conveniently with bytes in normal
 * user scenarios.
 *
 * Concretely: text(), hex(), json()
 */
export interface Data extends Uint8Array {
  text(): string
  hex(): HexString
  json(): Record<string, any>
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

export interface BeeResponse {
  message: string
  code: number
}

export interface ReferenceResponse {
  reference: Reference
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

/**
 * Higher level abstraction build on top of Feeds that allow easy setting and getting
 * data from feeds. It works closely with JSON.parse/stringify so all supported data
 * types by that is also supported by this abstraction.
 */
export interface JsonFeed<T extends AnyJson> {
  readonly writer: FeedWriter
  set(data: AnyJson): Promise<ReferenceResponse>
  get(): Promise<T>
}

export interface DataFeedOptions {
  signer?: Signer
  type?: FeedType
}

/**
 * FeedWriter is an interface for updating feeds
 */
export interface FeedWriter extends FeedReader {
  /**
   * Upload a new feed update
   *
   * @param reference The reference to be stored in the new update
   * @param options   Additional options like `at`
   *
   * @returns The reference of the new update
   */
  upload(reference: ChunkReference | Reference, options?: FeedUploadOptions): Promise<ReferenceResponse>
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
  upload: (identifier: Identifier, data: Uint8Array, options?: UploadOptions) => Promise<ReferenceResponse>
}

/*********************************************************
 * Ethereum compatible signing interfaces and definitions
 */

export const SIGNATURE_HEX_LENGTH = 130
export const SIGNATURE_BYTES_LENGTH = 65

export type Signature = Bytes<typeof SIGNATURE_BYTES_LENGTH>
export type PrivateKeyBytes = Bytes<32>
export type PublicKeyBytes = Bytes<32> | Bytes<64>

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
