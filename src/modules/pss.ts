import WebSocket from 'isomorphic-ws'
import type { BeeRequestOptions } from '../types'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { BatchId, PublicKey, Topic } from '../utils/typed-bytes'

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
  topic: Topic,
  target: string,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  recipient?: PublicKey,
): Promise<void> {
  await http<unknown>(requestOptions, {
    method: 'post',
    url: `${endpoint}/send/${topic}/${target}`,
    data,
    responseType: 'json',
    params: { recipient },
    headers: prepareRequestHeaders(postageBatchId),
  })
}

/**
 * Subscribe for messages on the given topic
 *
 * @param url Bee node URL
 * @param topic Topic name
 */
export function subscribe(url: string, topic: Topic, headers?: Record<string, string>): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')

  return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${topic.toHex()}`, {
    headers,
  })
}
