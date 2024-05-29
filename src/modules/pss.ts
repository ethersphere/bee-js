import WebSocket from 'isomorphic-ws'
import type { BatchId, BeeGenericResponse, BeeRequestOptions, PublicKey } from '../types'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'

const endpoint = 'pss'

/**
 * Send to recipient or target with Postal Service for Swarm
 *
 * @param requestOptions Options for making requests
 * @param topic Topic name
 * @param target Target message address prefix
 * @param data
 * @param postageBatchId Postage BatchId that will be assigned to sent message
 * @param recipient Recipient public key
 *
 */
export async function send(
  requestOptions: BeeRequestOptions,
  topic: string,
  target: string,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  recipient?: PublicKey,
): Promise<void> {
  await http<BeeGenericResponse>(requestOptions, {
    method: 'post',
    url: `${endpoint}/send/${topic}/${target}`,
    data,
    responseType: 'json',
    params: { recipient },
    headers: extractUploadHeaders(postageBatchId),
  })
}

/**
 * Subscribe for messages on the given topic
 *
 * @param url Bee node URL
 * @param topic Topic name
 */
export function subscribe(url: string, topic: string): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')

  return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${topic}`)
}
