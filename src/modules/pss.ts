import WebSocket from 'isomorphic-ws'

import type { BatchId, BeeGenericResponse, PublicKey } from '../types'
import { prepareData } from '../utils/data'
import { http } from '../utils/http'
import { extractUploadHeaders } from '../utils/headers'

const endpoint = '/pss'

/**
 * Send to recipient or target with Postal Service for Swarm
 *
 * @param url Bee url
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
  await http<BeeGenericResponse>({
    method: 'post',
    url: `${url}${endpoint}/send/${topic}/${target.slice(0, 4)}`,
    data: await prepareData(data),
    responseType: 'json',
    params: { recipient },
    headers: extractUploadHeaders(postageBatchId),
  })
}

/**
 * Subscribe for messages on the given topic
 *
 * @param topic Topic name
 */
export function subscribe(ky: Ky, topic: string): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')

  return new WebSocket(`${wsUrl}${endpoint}/subscribe/${topic}`)
}
