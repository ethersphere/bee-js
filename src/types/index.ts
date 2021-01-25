import { BeeError } from '../utils/error'

export interface Dictionary<T> {
  [Key: string]: T
}

export type Reference = string
export type PublicKey = string

export type Address = string
export type AddressPrefix = Address

export const REFERENCE_LENGTH = 64
export const ENCRYPTED_REFERENCE_LENGTH = 2 * REFERENCE_LENGTH

export interface UploadOptions {
  pin?: boolean
  encrypt?: boolean
  tag?: number
}

export interface DownloadOptions {
  timeout?: number
}

export interface UploadHeaders {
  'swarm-pin'?: string
  'swarm-encrypt'?: string
  'swarm-tag-uid'?: string
}

export interface Tag {
  total: number
  split: number
  seen: number
  stored: number
  sent: number
  synced: number
  uid: number
  name: string
  address: string
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
  onMessage: (message: Uint8Array, subscription: PssSubscription) => void
  onError: (error: BeeError, subscription: PssSubscription) => void
}

export interface BeeResponse {
  message: string
  code: number
}

/**
 * These type are used to create new nominal types
 *
 * See https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/
 */
export type BrandedType<T, N> = T & { __tag__: N }

export type BrandedString<N> = BrandedType<string, N>

export type FlavoredType<T, N> = T & { __tag__?: N }
