import { Dictionary, FileHeaders, UploadHeaders, UploadOptions } from '../types'
import { BeeError } from './error'

function readContentDispositionFilename(header?: string): string {
  try {
    if (!header) {
      throw new BeeError('missing content-disposition header')
    }
    const dispositionMatch = header.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i)

    if (dispositionMatch && dispositionMatch.length > 0) {
      return dispositionMatch[1]
    }
    throw new BeeError('invalid content-disposition header')
  } catch (e) {
    throw new BeeError(e.message)
  }
}

function readTagUid(header?: string): number | undefined {
  if (!header) {
    return undefined
  }

  return parseInt(header, 10)
}

export function readFileHeaders(headers: Dictionary<string>): FileHeaders {
  const name = readContentDispositionFilename(headers['content-disposition'])
  const tagUid = readTagUid(headers['swarm-tag-uid'])
  const contentType = headers['content-type']

  return {
    name,
    tagUid,
    contentType,
  }
}

export function extractUploadHeaders(options?: UploadOptions): UploadHeaders {
  const headers: UploadHeaders = {}

  if (options?.pin) headers['swarm-pin'] = String(options.pin)

  if (options?.encrypt) headers['swarm-encrypt'] = String(options.encrypt)

  if (options?.tag) headers['swarm-tag-uid'] = String(options.tag)

  return headers
}
