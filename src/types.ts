export interface Dictionary<T> {
  [Key: string]: T
}

export interface OptionsUpload {
  name?: string
  pin?: boolean
  encrypt?: boolean
  tag?: number
  size?: number // Content length, required if the uploaded data is readable stream
  index?: string // For collections
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
 * Alternative data structure for representing directories. Used mainly together with streaming.
 */
export type Collection<T> = Array<CollectionEntry<T>>
