import WebSocket from 'isomorphic-ws'

import { prepareData } from '../utils/data.js'
import { http } from '../utils/http.js'
import { extractUploadHeaders } from '../utils/headers.js'

import type { BatchId, BeeGenericResponse, Ky, PublicKey } from '../types/index.js'

const endpoint = 'pss'

/**
 * Send to recipient or target with Postal Service for Swarm
 *
 * @param ky Ky instance for given Bee class instance
 * @param topic Topic name
 * @param target Target message address prefix
 * @param data
 * @param postageBatchId Postage BatchId that will be assigned to sent message
 * @param recipient Recipient public key
 *
 */
export async function send(
  ky: Ky,
  topic: string,
  target: string,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  recipient?: PublicKey,
): Promise<void> {
  await http<BeeGenericResponse>(ky, {
    method: 'post',
    path: `${endpoint}/send/${topic}/${target}`,
    body: await prepareData(data),
    responseType: 'json',
    searchParams: { recipient },
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
