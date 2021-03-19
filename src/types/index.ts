import { BeeError } from '../utils/error'
import type { AxiosRequestConfig } from 'axios'
import { HexString } from '../utils/hex'
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
 */
export interface Data extends Uint8Array {
  text: () => string
  json: () => Record<string, any>
  hex: () => HexString
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

/**
 * These type are used to create new nominal types
 *
 * See https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/
 */
export type BrandedType<Type, Name> = Type & { __tag__: Name }

export type BrandedString<Name> = BrandedType<string, Name>

export type FlavoredType<Type, Name> = Type & { __tag__?: Name }
