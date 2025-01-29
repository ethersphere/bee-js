import { Types } from 'cafe-utility'
import {
  DownloadRedundancyOptions,
  EnvelopeWithBatchId,
  FileHeaders,
  UploadOptions,
  UploadRedundancyOptions,
} from '../types'
import { BeeError } from './error'
import { convertEnvelopeToMarshaledStamp } from './stamps'
import { BatchId } from './typed-bytes'

/**
 * Read the filename from the content-disposition header
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
 *
 * @param header the content-disposition header value
 *
 * @returns the filename
 */
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

export function extractUploadHeaders(
  stamp: EnvelopeWithBatchId | BatchId | Uint8Array | string,
  options?: UploadOptions,
): Record<string, string> {
  if (!stamp) {
    throw new BeeError('Stamp has to be specified!')
  }

  const headers: Record<string, string> = {}

  if (isEnvelopeWithBatchId(stamp)) {
    headers['swarm-postage-stamp'] = convertEnvelopeToMarshaledStamp(stamp).toHex()
  } else {
    stamp = new BatchId(stamp)
    headers['swarm-postage-batch-id'] = stamp.toHex()
  }

  if (options?.act) {
    headers['swarm-act'] = String(options.act)
  }

  if (options?.pin) {
    headers['swarm-pin'] = String(options.pin)
  }

  if (options?.encrypt) {
    headers['swarm-encrypt'] = String(options.encrypt)
  }

  if (options?.tag) {
    headers['swarm-tag'] = String(options.tag)
  }

  if (typeof options?.deferred === 'boolean') {
    headers['swarm-deferred-upload'] = options.deferred.toString()
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

export function extractRedundantUploadHeaders(
  postageBatchId: BatchId,
  options?: UploadOptions & UploadRedundancyOptions,
): Record<string, string> {
  const headers = extractUploadHeaders(postageBatchId, options)

  if (options?.redundancyLevel) {
    headers['swarm-redundancy-level'] = String(options.redundancyLevel)
  }

  return headers
}

export function extractDownloadHeaders(options?: DownloadRedundancyOptions): Record<string, string> {
  const headers: Record<string, string> = {}

  if (options?.redundancyStrategy) {
    headers['swarm-redundancy-strategy'] = String(options.redundancyStrategy)
  }

  if (options?.fallback === false) {
    headers['swarm-redundancy-fallback-mode'] = 'false'
  }

  if (options?.timeoutMs !== undefined) {
    headers['swarm-chunk-retrieval-timeout'] = String(options.timeoutMs)
  }

  return headers
}
