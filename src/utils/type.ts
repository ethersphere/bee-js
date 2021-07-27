import {
  Address,
  AddressPrefix,
  ADDRESS_HEX_LENGTH,
  BatchId,
  BATCH_ID_HEX_LENGTH,
  CollectionUploadOptions,
  ENCRYPTED_REFERENCE_HEX_LENGTH,
  FileUploadOptions,
  NumberString,
  PssMessageHandler,
  PUBKEY_HEX_LENGTH,
  PublicKey,
  Reference,
  REFERENCE_HEX_LENGTH,
  Tag,
  UploadOptions,
  AllTagsOptions,
  TAGS_LIMIT_MIN,
  TAGS_LIMIT_MAX,
  Readable,
  Collection,
  CollectionEntry,
} from '../types'
import { BeeArgumentError } from './error'
import { assertHexString } from './hex'
import type { Readable as NodeReadable } from 'stream'

/**
 * Validates if passed object is either browser's ReadableStream
 * or Node's Readable.
 *
 * @param entry
 */
export function isReadable(entry: unknown): entry is Readable {
  if (!isStrictlyObject(entry)) {
    return false
  }

  const nodeReadable = entry as NodeReadable

  if (typeof nodeReadable.pipe === 'function' && nodeReadable.readable && typeof nodeReadable._read === 'function') {
    return true
  }

  const browserReadable = entry as ReadableStream

  if (
    typeof browserReadable.getReader === 'function' &&
    browserReadable.locked !== undefined &&
    typeof browserReadable.cancel === 'function' &&
    typeof browserReadable.pipeTo === 'function' &&
    typeof browserReadable.pipeThrough === 'function'
  ) {
    return true
  }

  return false
}

export function isFile(file: unknown): file is File {
  // browser
  if (typeof File === 'function') {
    return file instanceof File
  }

  // node.js
  const f = file as File

  return (
    typeof f === 'object' &&
    typeof f.name === 'string' &&
    (typeof f.stream === 'function' || typeof f.arrayBuffer === 'function')
  )
}

export function isUint8Array(obj: unknown): obj is Uint8Array {
  return obj instanceof Uint8Array
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

/**
 * Generally it is discouraged to use `object` type, but in this case I think
 * it is best to do so as it is possible to easily convert from `object`to other
 * types, which will be usually the case after asserting that the object is
 * strictly object. With for examlpe Record<string, unknown> you have to first
 * cast it to `unknown` which I think bit defeat the purpose.
 *
 * @param value
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isStrictlyObject(value: unknown): value is object {
  return isObject(value) && !Array.isArray(value)
}

export function assertBoolean(value: unknown): asserts value is boolean {
  if (value !== true && value !== false) throw new TypeError('value is not boolean')
}

export function assertInteger(value: unknown, name = 'value'): asserts value is number | NumberString {
  if (!isInteger(value)) throw new TypeError(`${name} is not integer`)
}

export function assertNonNegativeInteger(value: unknown, name = 'Value'): asserts value is number | NumberString {
  assertInteger(value, name)

  if (Number(value) < 0) throw new BeeArgumentError(`${name} has to be bigger or equal to zero`, value)
}

export function assertReference(value: unknown): asserts value is Reference {
  try {
    assertHexString(value, REFERENCE_HEX_LENGTH)
  } catch (e) {
    assertHexString(value, ENCRYPTED_REFERENCE_HEX_LENGTH)
  }
}

export function assertAddress(value: unknown): asserts value is Address {
  assertHexString(value, ADDRESS_HEX_LENGTH, 'Address')
}

export function assertBatchId(value: unknown): asserts value is BatchId {
  assertHexString(value, BATCH_ID_HEX_LENGTH, 'BatchId')
}

export function assertUploadOptions(value: unknown, name = 'UploadOptions'): asserts value is UploadOptions {
  if (!isStrictlyObject(value)) {
    throw new TypeError(`${name} has to be an object!`)
  }

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

  if (options.axiosOptions && !isStrictlyObject(options.axiosOptions)) {
    throw new TypeError(`options.axiosOptions property in ${name} has to be object or undefined!`)
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

export function assertCollection(data: unknown): asserts data is Collection<Uint8Array | Readable> {
  if (!Array.isArray(data)) {
    throw new TypeError('Collection must be an array!')
  }

  for (const el of data) {
    if (!isStrictlyObject(el)) {
      throw new TypeError("Collection's entry must be an object!")
    }

    const entry = el as CollectionEntry<Uint8Array | Readable>

    if (!entry.path || typeof entry.path !== 'string') {
      throw new TypeError("Collection's entry must have string property path!")
    }

    if (!isUint8Array(entry.data) && !isReadable(entry.data)) {
      throw new TypeError("Collection's entry data must be either Uint8Array or Readable!")
    }

    if (isReadable(entry.data) && typeof entry.length !== 'number') {
      throw new TypeError('When collections entry uses Readable it has to also specify its length!')
    }
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

  const tag = value as Record<string, unknown>

  const numberProperties = ['total', 'processed', 'synced', 'uid']
  const correctNumberProperties = numberProperties.every(numberProperty => typeof tag[numberProperty] === 'number')

  if (!correctNumberProperties || !tag.startedAt || typeof tag.startedAt !== 'string') {
    return false
  }

  return true
}

export function assertTag(value: unknown): asserts value is Tag {
  if (!isStrictlyObject(value)) {
    throw new TypeError('Tag is not an object!')
  }

  const tag = value as Record<string, unknown>

  const numberProperties = ['total', 'processed', 'synced', 'uid']
  for (const numberProperty of numberProperties) {
    if (!tag[numberProperty]) {
      throw new TypeError(`Tag's property '${numberProperty}' has to be specified!`)
    }

    if (typeof tag[numberProperty] !== 'number') {
      throw new TypeError(`Tag's property '${numberProperty}' has to be number!`)
    }
  }

  if (!tag.startedAt) {
    throw new TypeError("Tag's property 'startedAt' has to be specified!")
  }

  if (typeof tag.startedAt !== 'string') {
    throw new TypeError("Tag's property 'startedAt' has to be string!")
  }
}

export function assertAddressPrefix(value: unknown): asserts value is AddressPrefix {
  assertHexString(value, undefined, 'AddressPrefix')

  if (value.length > ADDRESS_HEX_LENGTH) {
    throw new BeeArgumentError(
      `AddressPrefix must have length of ${ADDRESS_HEX_LENGTH} at most! Got string with ${value.length}`,
      value,
    )
  }
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

export function assertPublicKey(value: unknown): asserts value is PublicKey {
  assertHexString(value, PUBKEY_HEX_LENGTH, 'PublicKey')
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
export function assertFileData(value: unknown): asserts value is string | Uint8Array | Readable | File {
  if (typeof value !== 'string' && !(value instanceof Uint8Array) && !isFile(value) && !isReadable(value)) {
    throw new TypeError('Data must be either string, Readable, Uint8Array or File!')
  }
}

/**
 * Checks whether optional options for AllTags query are valid
 * @param options
 */
export function assertAllTagsOptions(options: unknown): asserts options is AllTagsOptions {
  if (options !== undefined && !isStrictlyObject(options)) {
    throw new TypeError('options has to be an object or undefined!')
  }

  const tagOptions = options as AllTagsOptions

  if (tagOptions?.limit !== undefined) {
    if (typeof tagOptions.limit !== 'number') {
      throw new TypeError('options.limit has to be a number or undefined!')
    }

    if (tagOptions.limit < TAGS_LIMIT_MIN) {
      throw new BeeArgumentError(`options.limit has to be at least ${TAGS_LIMIT_MIN}`, tagOptions.limit)
    }

    if (tagOptions.limit > TAGS_LIMIT_MAX) {
      throw new BeeArgumentError(`options.limit has to be at most ${TAGS_LIMIT_MAX}`, tagOptions.limit)
    }
  }

  if (tagOptions?.offset !== undefined) {
    assertNonNegativeInteger(tagOptions.offset, 'options.offset')
  }
}

/**
 * Utility functions that return Tag UID
 * @param tagUid
 */
export function makeTagUid(tagUid: number | Tag): number {
  if (isTag(tagUid)) {
    return tagUid.uid
  } else if (typeof tagUid === 'number') {
    assertNonNegativeInteger(tagUid, 'UID')

    return tagUid
  }

  throw new TypeError('tagUid has to be either Tag or a number (UID)!')
}
