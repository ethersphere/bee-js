import type { BatchId, FileHeaders, UploadOptions } from '../types/index.js'
import { BeeError } from './error.js'

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

export function readFileHeaders(headers: Headers): FileHeaders {
  const name = readContentDispositionFilename(headers.get('content-disposition'))
  const tagUid = readTagUid(headers.get('swarm-tag-uid'))
  const contentType = headers.get('content-type') || undefined

  return {
    name,
    tagUid,
    contentType,
  }
}

export function extractUploadHeaders(postageBatchId: BatchId, options?: UploadOptions): Record<string, string> {
  if (!postageBatchId) {
    throw new BeeError('Postage BatchID has to be specified!')
  }

  const headers: Record<string, string> = {
    'swarm-postage-batch-id': postageBatchId,
  }

  if (options?.pin) headers['swarm-pin'] = String(options.pin)

  if (options?.encrypt) headers['swarm-encrypt'] = String(options.encrypt)

  if (options?.tag) headers['swarm-tag'] = String(options.tag)

  if (typeof options?.deferred === 'boolean') headers['swarm-deferred-upload'] = options.deferred.toString()

  return headers
}
