import contentDisposition from 'content-disposition'

import { Dictionary, FileHeaders, UploadHeaders, UploadOptions } from "../types"
import { BeeError } from "./error"

function readContentDispositionFilename(header?: string): string {
  try {
    if (header == null) {
      throw new BeeError('missing content-disposition header')
    }
    const disposition = contentDisposition.parse(header)

    if (disposition?.parameters?.filename) {
      return disposition.parameters.filename
    }
    throw new BeeError('invalid content-disposition header')
  } catch (e) {
    throw new BeeError(e.message)
  }
}

function readTagUid(header?: string): number | undefined {
  if (header == null) {
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
