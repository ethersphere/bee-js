import {
  Address,
  ADDRESS_HEX_LENGTH,
  AddressPrefix,
  BATCH_ID_HEX_LENGTH,
  BatchId,
  CollectionUploadOptions,
  ENCRYPTED_REFERENCE_HEX_LENGTH,
  FileUploadOptions,
  PssMessageHandler,
  PUBKEY_HEX_LENGTH,
  PublicKey,
  Reference,
  REFERENCE_HEX_LENGTH,
  Tag,
  UploadOptions,
  NumberString,
} from '../types'
import { assertHexString } from './hex'
import { BeeArgumentError } from './error'
import { Readable } from 'stream'
import { isFile } from './file'

export function isReadable(entry: unknown): entry is Readable {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as Readable).pipe === 'function' &&
    (entry as Readable).readable &&
    typeof (entry as Readable)._read === 'function'
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

export function assertInteger(value: unknown): asserts value is number | NumberString {
  if (!isInteger(value)) throw new TypeError('value is not integer')
}

export function assertNonNegativeInteger(value: unknown, name = 'Value'): asserts value is number | NumberString {
  assertInteger(value)

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
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
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

  if (options.axiosOptions && (typeof options.axiosOptions !== 'object' || Array.isArray(options.axiosOptions))) {
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
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
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
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
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
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('PssMessageHandler has to be object!')
  }

  const handler = value as PssMessageHandler

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

export function assertData(value: unknown): asserts value is string | Uint8Array {
  if (typeof value !== 'string' && !(value instanceof Uint8Array)) {
    throw new TypeError('Data must be either string or Uint8Array!')
  }
}

export function assertFileData(value: unknown): asserts value is string | Uint8Array | Readable | File {
  if (typeof value !== 'string' && !(value instanceof Uint8Array) && !isFile(value) && !isReadable(value)) {
    throw new TypeError('Data must be either string, Readable, Uint8Array or File!')
  }
}
