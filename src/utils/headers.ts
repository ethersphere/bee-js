import { Types } from 'cafe-utility'
import { EnvelopeWithBatchId, FileHeaders } from '../types'
import { BeeError } from './error'
import { convertEnvelopeToMarshaledStamp } from './stamps'
import { BatchId, PublicKey, Reference } from './typed-bytes'

export function readFileHeaders(headers: Record<string, string>): FileHeaders {
  const name = readContentDispositionFilename(headers['content-disposition'])
  const tagUid = readTagUid(headers['swarm-tag-uid'])
  const contentType = headers['content-type'] || undefined

  return {
    name,
    tagUid,
    contentType,
  }
}

function readContentDispositionFilename(header: string | null): string {
  if (!header) {
    throw new BeeError('missing content-disposition header')
  }

  // Regex was found here
  // https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header
  const dispositionMatch = header.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i)

  if (dispositionMatch && dispositionMatch.length > 0) {
    return dispositionMatch[1]
  }
  throw new BeeError('invalid content-disposition header')
}

function readTagUid(header: string | null): number | undefined {
  if (!header) {
    return undefined
  }

  return parseInt(header, 10)
}

export function prepareRequestHeaders(
  stamp: BatchId | Uint8Array | string | EnvelopeWithBatchId | null,
  nullableOptions?: unknown,
): Record<string, string> {
  const headers: Record<string, string> = {}

  if (isEnvelopeWithBatchId(stamp)) {
    headers['swarm-postage-stamp'] = convertEnvelopeToMarshaledStamp(stamp).toHex()
  } else if (stamp) {
    stamp = new BatchId(stamp)
    headers['swarm-postage-batch-id'] = stamp.toHex()
  }

  if (!nullableOptions) {
    return headers
  }

  const options = Types.asObject(nullableOptions)

  if (options.size) {
    headers['content-length'] = String(options.size)
  }

  if (options.contentType) {
    headers['content-type'] = String(options.contentType)
  }

  if (options.redundancyLevel) {
    headers['swarm-redundancy-level'] = String(options.redundancyLevel)
  }

  if (Types.isBoolean(options.act)) {
    headers['swarm-act'] = String(options.act)
  }

  if (Types.isBoolean(options.pin)) {
    headers['swarm-pin'] = String(options.pin)
  }

  if (Types.isBoolean(options.encrypt)) {
    headers['swarm-encrypt'] = options.encrypt.toString()
  }

  if (options.tag) {
    headers['swarm-tag'] = String(options.tag)
  }

  if (Types.isBoolean(options.deferred)) {
    headers['swarm-deferred-upload'] = options.deferred.toString()
  }

  if (options.redundancyStrategy) {
    headers['swarm-redundancy-strategy'] = String(options.redundancyStrategy)
  }

  if (Types.isBoolean(options.fallback)) {
    headers['swarm-redundancy-fallback-mode'] = options.fallback.toString()
  }

  if (options.timeoutMs) {
    headers['swarm-chunk-retrieval-timeout'] = String(options.timeoutMs)
  }

  if (options.indexDocument) {
    headers['swarm-index-document'] = String(options.indexDocument)
  }

  if (options.errorDocument) {
    headers['swarm-error-document'] = String(options.errorDocument)
  }

  if (options.actPublisher) {
    headers['swarm-act-publisher'] = new PublicKey(options.actPublisher as any).toCompressedHex()
  }

  if (options.actHistoryAddress) {
    headers['swarm-act-history-address'] = new Reference(options.actHistoryAddress as any).toHex()
  }

  if (options.actTimestamp) {
    headers['swarm-act-timestamp'] = String(options.actTimestamp)
  }

  if (options.actPublisher || options.actHistoryAddress || options.actTimestamp) {
    headers['swarm-act'] = 'true'
  }

  return headers
}

function isEnvelopeWithBatchId(value: unknown): value is EnvelopeWithBatchId {
  if (!Types.isObject(value)) {
    return false
  }

  const envelope = value as EnvelopeWithBatchId

  return (
    envelope.issuer !== undefined &&
    envelope.index !== undefined &&
    envelope.signature !== undefined &&
    envelope.timestamp !== undefined &&
    envelope.batchId !== undefined
  )
}
