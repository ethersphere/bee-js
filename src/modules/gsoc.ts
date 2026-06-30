import WebSocket from 'isomorphic-ws'
import { BeeRequestOptions, UploadOptions } from '..'
import { SingleOwnerChunk, uploadSingleOwnerChunk } from '../chunk/soc'
import { BatchId, Reference } from '../utils/typed-bytes'
import { prepareWebsocketConnection } from '../utils/data'

const endpoint = 'gsoc'

export async function send(
  requestOptions: BeeRequestOptions,
  soc: SingleOwnerChunk,
  stamp: BatchId,
  options?: UploadOptions,
) {
  return uploadSingleOwnerChunk(requestOptions, soc, stamp, options)
}

export function subscribe(url: string, reference: Reference, headers?: Record<string, string>): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')
  const wsUrlWithParams = `${wsUrl}/${endpoint}/subscribe/${reference.toHex()}`

  return prepareWebsocketConnection(wsUrlWithParams, headers)
}
