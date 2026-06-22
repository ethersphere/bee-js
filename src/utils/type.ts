import * as stream from 'stream'
import { NumberString, Tag } from '../types'
import { isFile } from './file'
import { TagInputSchema, TagUidSchema } from './schema'

export function isReadable(value: unknown): value is stream.Readable {
  return typeof stream.Readable !== 'undefined' && value instanceof stream.Readable
}

export function asNumberString(value: unknown, options?: { name?: string; min?: bigint; max?: bigint }): NumberString {
  if (typeof value === 'bigint') {
    value = value.toString()
  }

  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) {
    throw new TypeError(`${options?.name ?? 'value'} is not a valid integer string, got: ${value}`)
  }

  if (options?.min !== undefined && BigInt(value) < options.min) {
    throw new RangeError(`${options?.name ?? 'value'} must be >= ${options.min}, got: ${value}`)
  }

  if (options?.max !== undefined && BigInt(value) > options.max) {
    throw new RangeError(`${options?.name ?? 'value'} must be <= ${options.max}, got: ${value}`)
  }

  return value as NumberString
}

export function isTag(value: unknown): value is Tag {
  return TagInputSchema.safeParse(value).success
}

/**
 * Check whether the given parameter is valid data to upload
 * @param value
 * @throws TypeError if not valid
 */
export function assertData(value: unknown): asserts value is string | Uint8Array {
  if (typeof value !== 'string' && !(value instanceof Uint8Array)) {
    throw new TypeError('Data must be either string or Uint8Array!')
  }
}

/**
 * Check whether the given parameter is a correct file representation to file upload.
 * @param value
 * @throws TypeError if not valid
 */
export function assertFileData(value: unknown): asserts value is string | Uint8Array | stream.Readable | File {
  if (typeof value !== 'string' && !(value instanceof Uint8Array) && !isFile(value) && !isReadable(value)) {
    throw new TypeError('Data must be either string, Readable, Uint8Array or File!')
  }
}

/**
 * Utility functions that return Tag UID
 * @param tagUid
 */
export function makeTagUid(tagUid: number | Tag | string | null | undefined): number {
  if (tagUid === undefined || tagUid === null) {
    throw new TypeError(`Expected number | Tag | string from tagUid, got: ${tagUid}`)
  }

  if (isTag(tagUid)) {
    return tagUid.uid
  } else if (typeof tagUid === 'number' || typeof tagUid === 'string') {
    return TagUidSchema.parse(tagUid)
  }

  throw new TypeError(`Expected number | Tag | string from tagUid, got: ${tagUid}`)
}
