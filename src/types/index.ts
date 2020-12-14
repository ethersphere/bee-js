export interface Dictionary<T> {
  [Key: string]: T
}

export type Reference = string

export const REFERENCE_LENGTH = 64
export const ENCRYPTED_REFERENCE_LENGTH = 2 * REFERENCE_LENGTH

export interface UploadOptions {
  pin?: boolean
  encrypt?: boolean
  tag?: number
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

  /**
   * Required when `data` is Readable.
   */
  size?: number
}

/**
 * Represents Collections
 */
export type Collection<T> = Array<CollectionEntry<T>>
