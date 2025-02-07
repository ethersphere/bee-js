import { Types } from 'cafe-utility'
import * as stream from 'stream'
import {
  AllTagsOptions,
  BeeRequestOptions,
  CollectionUploadOptions,
  DownloadOptions,
  FileUploadOptions,
  GsocMessageHandler,
  NumberString,
  PostageBatchOptions,
  PssMessageHandler,
  RedundantUploadOptions,
  Tag,
  TAGS_LIMIT_MAX,
  TAGS_LIMIT_MIN,
  TransactionOptions,
  UploadOptions,
} from '../types'
import { isFile } from './file'
import { PublicKey, Reference } from './typed-bytes'

export function isReadable(obj: unknown): obj is stream.Readable {
  return typeof stream.Readable !== 'undefined' && obj instanceof stream.Readable
}

export function asNumberString(value: unknown, options?: { name?: string; min?: bigint; max?: bigint }): NumberString {
  if (typeof value === 'bigint') {
    value = value.toString()
  }

  return Types.asIntegerString(value, options) as NumberString
}

export function prepareBeeRequestOptions(value: unknown): BeeRequestOptions {
  const object = Types.asObject(value, { name: 'BeeRequestOptions' })

  return {
    baseURL: Types.asOptional(x => Types.asString(x, { name: 'baseURL' }), object.baseURL),
    timeout: Types.asOptional(x => Types.asInteger(x, { name: 'timeout', min: 0 }), object.timeout),
    headers: Types.asOptional(x => Types.asStringMap(x, { name: 'headers' }), object.headers),
    onRequest: Types.asOptional(x => Types.asFunction(x, { name: 'onRequest' }), object.onRequest) as
      | BeeRequestOptions['onRequest']
      | undefined,
    httpAgent: object.httpAgent,
    httpsAgent: object.httpsAgent,
    endlesslyRetry: Types.asOptional(x => Types.asBoolean(x, { name: 'endlesslyRetry' }), object.endlesslyRetry),
  }
}

export function prepareDownloadOptions(value: unknown): DownloadOptions {
  const object = Types.asObject(value, { name: 'DownloadOptions' })

  return {
    redundancyStrategy: Types.asOptional(
      x => Types.asInteger(x, { name: 'redundancyStrategy' }),
      object.redundancyStrategy,
    ),
    fallback: Types.asOptional(x => Types.asBoolean(x, { name: 'fallback' }), object.fallback),
    timeoutMs: Types.asOptional(x => Types.asInteger(x, { name: 'timeoutMs', min: 0 }), object.timeoutMs),
    actPublisher: Types.asOptional(x => new PublicKey(x), object.actPublisher),
    actHistoryAddress: Types.asOptional(x => new Reference(x), object.actHistoryAddress),
    actTimestamp: Types.asOptional(x => Types.asNumber(x, { name: 'actTimestamp' }), object.actTimestamp),
  }
}

export function prepareUploadOptions(value: unknown, name = 'UploadOptions'): UploadOptions {
  const object = Types.asObject(value, { name })

  return {
    act: Types.asOptional(x => Types.asBoolean(x, { name: 'act' }), object.act),
    deferred: Types.asOptional(x => Types.asBoolean(x, { name: 'deferred' }), object.deferred),
    encrypt: Types.asOptional(x => Types.asBoolean(x, { name: 'encrypt' }), object.encrypt),
    pin: Types.asOptional(x => Types.asBoolean(x, { name: 'pin' }), object.pin),
    tag: Types.asOptional(x => Types.asInteger(x, { name: 'tag', min: 0 }), object.tag),
  }
}

export function prepareRedundantUploadOptions(value: unknown, name = 'UploadOptions'): RedundantUploadOptions {
  const uploadOptions = prepareUploadOptions(value, name)

  const object = Types.asObject(value, { name })

  return {
    ...uploadOptions,
    redundancyLevel: Types.asOptional(
      x => Types.asInteger(x, { name: 'redundancyLevel', min: 0 }),
      object.redundancyLevel,
    ),
  }
}

export function prepareFileUploadOptions(value: unknown): FileUploadOptions {
  const uploadOptions = prepareUploadOptions(value, 'FileUploadOptions')

  const object = Types.asObject(value, { name: 'FileUploadOptions' })

  return {
    ...uploadOptions,
    size: Types.asOptional(x => Types.asInteger(x, { name: 'size', min: 0 }), object.size),
    contentType: Types.asOptional(x => Types.asString(x, { name: 'contentType' }), object.contentType),
    redundancyLevel: Types.asOptional(
      x => Types.asInteger(x, { name: 'redundancyLevel', min: 0 }),
      object.redundancyLevel,
    ),
  }
}

export function prepareCollectionUploadOptions(value: unknown): CollectionUploadOptions {
  const uploadOptions = prepareUploadOptions(value, 'CollectionUploadOptions')

  const object = Types.asObject(value, { name: 'CollectionUploadOptions' })

  return {
    ...uploadOptions,
    errorDocument: Types.asOptional(x => Types.asString(x, { name: 'errorDocument' }), object.errorDocument),
    indexDocument: Types.asOptional(x => Types.asString(x, { name: 'indexDocument' }), object.indexDocument),
    redundancyLevel: Types.asOptional(
      x => Types.asInteger(x, { name: 'redundancyLevel', min: 0 }),
      object.redundancyLevel,
    ),
  }
}

export function isTag(value: unknown): value is Tag {
  try {
    const object = Types.asObject(value, { name: 'Tag' })
    Types.asInteger(object.uid, { name: 'Tag.uid' })
    return true
  } catch {
    return false
  }
}

export function preparePssMessageHandler(value: unknown): PssMessageHandler {
  const object = Types.asObject(value, { name: 'PssMessageHandler' })

  return {
    onMessage: Types.asFunction(object.onMessage, { name: 'onMessage' }) as PssMessageHandler['onMessage'],
    onError: Types.asFunction(object.onError, { name: 'onError' }) as PssMessageHandler['onError'],
  }
}

export function prepareGsocMessageHandler(value: unknown): GsocMessageHandler {
  const object = Types.asObject(value, { name: 'GsocMessageHandler' })

  return {
    onMessage: Types.asFunction(object.onMessage, { name: 'onMessage' }) as GsocMessageHandler['onMessage'],
    onError: Types.asFunction(object.onError, { name: 'onError' }) as GsocMessageHandler['onError'],
  }
}

export function preparePostageBatchOptions(value: unknown): PostageBatchOptions {
  const object = Types.asObject(value, { name: 'PostageBatchOptions' })

  return {
    gasPrice: Types.asOptional(x => asNumberString(x, { name: 'gasPrice' }), object.gasPrice),
    immutableFlag: Types.asOptional(x => Types.asBoolean(x, { name: 'immutableFlag' }), object.immutableFlag),
    label: Types.asOptional(x => Types.asString(x, { name: 'label' }), object.label),
    waitForUsable: Types.asOptional(x => Types.asBoolean(x, { name: 'waitForUsable' }), object.waitForUsable),
    waitForUsableTimeout: Types.asOptional(
      x => Types.asInteger(x, { name: 'waitForUsableTimeout', min: 0 }),
      object.waitForUsableTimeout,
    ),
  }
}

export function prepareTransactionOptions(value: unknown, name = 'TransactionOptions'): TransactionOptions {
  const object = Types.asObject(value, { name })

  return {
    gasLimit: Types.asOptional(x => asNumberString(x, { name: 'gasLimit', min: 0n }), object.gasLimit),
    gasPrice: Types.asOptional(x => asNumberString(x, { name: 'gasPrice', min: 0n }), object.gasPrice),
  }
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
export function prepareAllTagsOptions(value: unknown): AllTagsOptions {
  const object = Types.asObject(value, { name: 'AllTagsOptions' })

  return {
    limit: Types.asOptional(
      x => Types.asInteger(x, { name: 'limit', min: TAGS_LIMIT_MIN, max: TAGS_LIMIT_MAX }),
      object.limit,
    ),
    offset: Types.asOptional(x => Types.asInteger(x, { name: 'offset', min: 0 }), object.offset),
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
    return Types.asNumber(tagUid, { name: 'tagUid', min: 0 })
  }

  throw new TypeError(`Expected number | Tag | string from tagUid, got: ${tagUid}`)
}
