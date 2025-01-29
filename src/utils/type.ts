import { Types } from 'cafe-utility'
import * as stream from 'stream'
import {
  AllTagsOptions,
  BeeRequestOptions,
  CashoutOptions,
  CollectionUploadOptions,
  FileUploadOptions,
  NumberString,
  PostageBatchOptions,
  PssMessageHandler,
  Tag,
  TAGS_LIMIT_MAX,
  TAGS_LIMIT_MIN,
  TransactionOptions,
  UploadOptions,
} from '../types'
import { BeeArgumentError } from './error'
import { isFile } from './file'

export function isReadable(obj: unknown): obj is stream.Readable {
  return typeof stream.Readable !== 'undefined' && obj instanceof stream.Readable
}

export function asNumberString(value: unknown, options?: { name?: string; min?: bigint; max?: bigint }): NumberString {
  if (typeof value === 'bigint') {
    value = value.toString()
  }

  return Types.asIntegerString(value, options) as NumberString
}

export function isInteger(value: unknown): value is number | NumberString {
  return (
    (typeof value === 'string' && /^-?(0|[1-9][0-9]*)$/g.test(value)) ||
    (typeof value === 'number' &&
      value > Number.MIN_SAFE_INTEGER &&
      value < Number.MAX_SAFE_INTEGER &&
      Number.isInteger(value))
  )
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

export function isStrictlyObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value)
}

export function assertStrictlyObject(value: unknown, name = 'value'): asserts value is object {
  if (!isStrictlyObject(value)) {
    throw new TypeError(`${name} has to be an object that is not null nor array!`)
  }
}

export function assertBoolean(value: unknown, name = 'value'): asserts value is boolean {
  if (value !== true && value !== false) throw new TypeError(`${name} is not boolean`)
}

export function assertInteger(value: unknown, name = 'value'): asserts value is number | NumberString {
  if (!isInteger(value)) throw new TypeError(`${name} is not integer`)
}

export function assertNonNegativeInteger(value: unknown, name = 'Value'): asserts value is number | NumberString {
  assertInteger(value, name)

  if (Number(value) < 0) throw new BeeArgumentError(`${name} has to be bigger or equal to zero`, value)
}

export function assertRequestOptions(value: unknown, name = 'RequestOptions'): asserts value is BeeRequestOptions {
  if (value === undefined) {
    return
  }

  if (!isStrictlyObject(value)) {
    throw new TypeError(`${name} has to be an object!`)
  }

  const options = value as BeeRequestOptions

  if (options.timeout) {
    assertNonNegativeInteger(options.timeout, `${name}.timeout`)
  }
}

export function assertUploadOptions(value: unknown, name = 'UploadOptions'): asserts value is UploadOptions {
  if (!isStrictlyObject(value)) {
    throw new TypeError(`${name} has to be an object!`)
  }

  assertRequestOptions(value, name)

  const options = value as UploadOptions

  if (options.pin && typeof options.pin !== 'boolean') {
    throw new TypeError(`options.pin property in ${name} has to be boolean or undefined!`)
  }

  if (options.encrypt && typeof options.encrypt !== 'boolean') {
    throw new TypeError(`options.encrypt property in ${name} has to be boolean or undefined!`)
  }

  if (options.tag) {
    if (typeof options.tag !== 'number') {
      throw new TypeError(`options.tag property in ${name} has to be number or undefined!`)
    }

    assertNonNegativeInteger(options.tag, 'options.tag')
  }
}

export function assertFileUploadOptions(value: unknown): asserts value is FileUploadOptions {
  assertUploadOptions(value, 'FileUploadOptions')

  const options = value as FileUploadOptions

  if (options.size) {
    if (typeof options.size !== 'number') {
      throw new TypeError('tag property in FileUploadOptions has to be number or undefined!')
    }

    assertNonNegativeInteger(options.size, 'options.size')
  }

  if (options.contentType && typeof options.contentType !== 'string') {
    throw new TypeError('contentType property in FileUploadOptions has to be string or undefined!')
  }
}

export function assertCollectionUploadOptions(value: unknown): asserts value is CollectionUploadOptions {
  assertUploadOptions(value, 'CollectionUploadOptions')

  const options = value as CollectionUploadOptions

  if (options.indexDocument && typeof options.indexDocument !== 'string') {
    throw new TypeError('indexDocument property in CollectionUploadOptions has to be string or undefined!')
  }

  if (options.errorDocument && typeof options.errorDocument !== 'string') {
    throw new TypeError('errorDocument property in CollectionUploadOptions has to be string or undefined!')
  }
}

export function isTag(value: unknown): value is Tag {
  if (!isStrictlyObject(value)) {
    return false
  }

  return Boolean(value.uid)
}

export function assertPssMessageHandler(value: unknown): asserts value is PssMessageHandler {
  if (!isStrictlyObject(value)) {
    throw new TypeError('PssMessageHandler has to be object!')
  }

  const handler = value as unknown as PssMessageHandler

  if (typeof handler.onMessage !== 'function') {
    throw new TypeError('onMessage property of PssMessageHandler has to be function!')
  }

  if (typeof handler.onError !== 'function') {
    throw new TypeError('onError property of PssMessageHandler has to be function!')
  }
}

export function assertPostageBatchOptions(value: unknown): asserts value is PostageBatchOptions {
  if (value === undefined) {
    return
  }

  assertStrictlyObject(value)

  const options = value as PostageBatchOptions
  assertRequestOptions(options, 'PostageBatchOptions')

  if (options?.gasPrice) {
    assertNonNegativeInteger(options.gasPrice)
  }

  if (options?.immutableFlag !== undefined) {
    assertBoolean(options.immutableFlag)
  }

  if (options?.waitForUsable !== undefined) {
    assertBoolean(options.waitForUsable)
  }

  if (options?.waitForUsableTimeout !== undefined) {
    assertNonNegativeInteger(options.waitForUsableTimeout, 'options.waitForUsableTimeout')
  }
}

export function assertTransactionOptions(
  value: unknown,
  name = 'TransactionOptions',
): asserts value is TransactionOptions {
  if (value === undefined) {
    return
  }

  assertStrictlyObject(value, name)
  const options = value as TransactionOptions

  if (options?.gasLimit) {
    assertNonNegativeInteger(options.gasLimit, name)
  }

  if (options?.gasPrice) {
    assertNonNegativeInteger(options.gasPrice, name)
  }
}

export function assertCashoutOptions(value: unknown): asserts value is CashoutOptions {
  if (value === undefined) {
    return
  }

  assertStrictlyObject(value)

  const options = value as CashoutOptions
  assertRequestOptions(options, 'CashoutOptions')
  assertTransactionOptions(options, 'CashoutOptions')
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
 * Checks whether optional options for AllTags query are valid
 * @param options
 */
export function assertAllTagsOptions(entry: unknown): asserts entry is AllTagsOptions {
  if (entry !== undefined && !isStrictlyObject(entry)) {
    throw new TypeError('options has to be an object or undefined!')
  }

  assertRequestOptions(entry, 'AllTagsOptions')

  const options = entry as AllTagsOptions

  if (options?.limit !== undefined) {
    if (typeof options.limit !== 'number') {
      throw new TypeError('AllTagsOptions.limit has to be a number or undefined!')
    }

    if (options.limit < TAGS_LIMIT_MIN) {
      throw new BeeArgumentError(`AllTagsOptions.limit has to be at least ${TAGS_LIMIT_MIN}`, options.limit)
    }

    if (options.limit > TAGS_LIMIT_MAX) {
      throw new BeeArgumentError(`AllTagsOptions.limit has to be at most ${TAGS_LIMIT_MAX}`, options.limit)
    }
  }

  if (options?.offset !== undefined) {
    assertNonNegativeInteger(options.offset, 'AllTagsOptions.offset')
  }
}

/**
 * Utility functions that return Tag UID
 * @param tagUid
 */
export function makeTagUid(tagUid: number | Tag | string | null | undefined): number {
  if (tagUid === undefined || tagUid === null) {
    throw new TypeError('TagUid was expected but got undefined or null instead!')
  }

  if (isTag(tagUid)) {
    return tagUid.uid
  } else if (typeof tagUid === 'number') {
    assertNonNegativeInteger(tagUid, 'UID')

    return tagUid
  } else if (typeof tagUid === 'string') {
    const int = parseInt(tagUid)

    if (isNaN(int)) {
      throw new TypeError('Passed tagUid string is not valid integer!')
    }

    if (int < 0) {
      throw new TypeError(`TagUid was expected to be positive non-negative integer! Got ${int}`)
    }

    return int
  }

  throw new TypeError('tagUid has to be either Tag or a number (UID)!')
}
