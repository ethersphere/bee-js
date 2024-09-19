import { decodeCid, encodeReference, ReferenceType } from '@ethersphere/swarm-cid'
import { Readable } from 'stream'
import {
  Address,
  ADDRESS_HEX_LENGTH,
  AddressPrefix,
  AllTagsOptions,
  BATCH_ID_HEX_LENGTH,
  BatchId,
  BeeRequestOptions,
  CashoutOptions,
  CollectionUploadOptions,
  ENCRYPTED_REFERENCE_HEX_LENGTH,
  FileUploadOptions,
  NumberString,
  PostageBatchOptions,
  PSS_TARGET_HEX_LENGTH_MAX,
  PssMessageHandler,
  PUBKEY_HEX_LENGTH,
  PublicKey,
  Reference,
  REFERENCE_HEX_LENGTH,
  ReferenceOrEns,
  Tag,
  TAGS_LIMIT_MAX,
  TAGS_LIMIT_MIN,
  TransactionHash,
  TransactionOptions,
  UploadOptions,
} from '../types'
import { BeeArgumentError, BeeError } from './error'
import { isFile } from './file'
import { assertHexString, assertPrefixedHexString, isHexString } from './hex'

export function isReadable(obj: unknown): obj is Readable {
  return typeof Readable !== 'undefined' && obj instanceof Readable
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

export function isStrictlyObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value)
}

/**
 * Asserts if object is Error
 *
 * @param e
 */
export function isError(e: unknown): e is Error {
  return e instanceof Error
}

// eslint-disable-next-line @typescript-eslint/ban-types
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

export function assertPositiveInteger(value: unknown, name = 'Value'): asserts value is number | NumberString {
  assertInteger(value, name)

  if (Number(value) <= 0) throw new BeeArgumentError(`${name} has to be bigger then zero`, value)
}

export function assertReference(value: unknown): asserts value is Reference {
  try {
    assertHexString(value, REFERENCE_HEX_LENGTH)
  } catch (e) {
    assertHexString(value, ENCRYPTED_REFERENCE_HEX_LENGTH)
  }
}

export function assertReferenceOrEns(value: unknown): asserts value is ReferenceOrEns {
  if (typeof value !== 'string') {
    throw new TypeError('ReferenceOrEns has to be a string!')
  }

  if (isHexString(value)) {
    assertReference(value)

    return
  }

  /**
   * a.asdf - VALID
   * test.eth - VALID
   * ADAM.ETH - VALID
   * ADAM UHLIR.ETH - INVALID
   * test.whatever.eth - VALID
   * -adg.ets - INVALID
   * adg-.ets - INVALID
   * as-a.com - VALID
   * ethswarm.org - VALID
   * http://asdf.asf - INVALID
   * řš+ýí.šě+ř.čě - VALID
   * tsg.asg?asg - INVALID
   * tsg.asg:1599 - INVALID
   * ethswarm.something- - INVALID
   * ethswarm.-something - INVALID
   * ethswarm.some-thing - VALID
   *
   * The idea of this regex is to match strings that are 1 to 63 characters long and do not start or end with dash character
   *
   * This part matches 2-63 character string that does not start or end with -
   * [^-.\/?:\s][^.\/?:\s]{0,61}[^-.\/?:\s]   <regexp1>
   *
   * For 1 character long string we use the part after |
   * [^-.\/?:\s]   <regexp2>
   *
   * This is terminated in a group with . character an repeated at least once
   * (<regexp1>|<regexp2>\.)+
   *
   * This covers everything but top level domain which is 2 to 63 characters long so we can just use the <regexp2> again
   * ^(<regexp1>|<regexp2>\.)+<regexp1>$
   */
  const DOMAIN_REGEX =
    /^(?:(?:[^-.\/?:\s][^.\/?:\s]{0,61}[^-.\/?:\s]|[^-.\/?:\s]{1,2})\.)+[^-.\/?:\s][^.\/?:\s]{0,61}[^-.\/?:\s]$/

  // We are doing best-effort validation of domain here. The proper way would be to do validation using IDNA UTS64 standard
  // but that would give us high penalty to our dependencies as the library (idna-uts46-hx) that does this validation and translation
  // adds 160kB minified size which is significant. We expects that full validation will be done on Bee side.
  if (!DOMAIN_REGEX.test(value)) {
    throw new TypeError('ReferenceOrEns is not valid Reference, but also not valid ENS domain.')
  }
}

/**
 * Function that mainly converts Swarm CID into hex encoded Swarm Reference
 *
 * @param value
 * @param expectedCidType
 */
export function makeReferenceOrEns(value: unknown, expectedCidType: ReferenceType): ReferenceOrEns {
  if (typeof value !== 'string') {
    throw new TypeError('ReferenceCidOrEns has to be a string!')
  }

  try {
    const result = decodeCid(value)

    if (result.type !== expectedCidType) {
      throw new BeeError(
        `CID was expected to be of type ${expectedCidType}, but got instead ${result.type ?? 'non-Swarm CID'}`,
      )
    }

    return result.reference
  } catch (e) {
    if (e instanceof BeeError) throw e
  }

  assertReferenceOrEns(value)

  return value
}

/**
 * Function that adds getter which converts the reference into CID base32 encoded string.
 * @param result
 * @param cidType Type as described in the @ethersphere/swarm-cids-js -> ReferenceType
 */
export function addCidConversionFunction<T extends { reference: string }>(
  result: T,
  cidType: ReferenceType,
): T & { cid: () => string } {
  return {
    ...result,
    cid() {
      return encodeReference(result.reference, cidType).toString()
    },
  }
}

export function assertAddress(value: unknown): asserts value is Address {
  assertHexString(value, ADDRESS_HEX_LENGTH, 'Address')
}

export function assertBatchId(value: unknown): asserts value is BatchId {
  assertHexString(value, BATCH_ID_HEX_LENGTH, 'BatchId')
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

  if (value.length > PSS_TARGET_HEX_LENGTH_MAX) {
    throw new BeeArgumentError(
      `AddressPrefix must have length of ${PSS_TARGET_HEX_LENGTH_MAX} at most! Got string with ${value.length}`,
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
export function assertFileData(value: unknown): asserts value is string | Uint8Array | Readable | File {
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

export function assertTransactionHash(transactionHash: unknown): asserts transactionHash is TransactionHash {
  if (typeof transactionHash !== 'string') {
    throw new TypeError('TransactionHash has to be a string!')
  }

  assertPrefixedHexString(transactionHash, 'TransactionHash')

  // Hash is 64 long + '0x' prefix = 66
  if (transactionHash.length !== 66) {
    throw new TypeError('TransactionHash has to be prefixed hex string with total length 66 (prefix including)')
  }
}
