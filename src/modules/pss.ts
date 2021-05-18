import WebSocket from 'isomorphic-ws'

import type { BeeResponse, PublicKey } from '../types'
import { prepareData } from '../utils/data'
import { safeAxios } from '../utils/safeAxios'
import { Address } from '../types'
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
  url: string,
  topic: string,
  target: string,
  data: string | Uint8Array,
  postageBatchId: Address,
  recipient?: PublicKey,
): Promise<BeeResponse> {
  const response = await safeAxios<BeeResponse>({
    method: 'post',
    url: `${url}${endpoint}/send/${topic}/${target.slice(0, 4)}`,
    data: await prepareData(data),
    responseType: 'json',
    params: { recipient },
    headers: extractUploadHeaders(postageBatchId),
  })

  return response.data
}

/**
 * Subscribe for messages on the given topic
 *
 * @param topic Topic name
 */
export function subscribe(url: string, topic: string): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')

  return new WebSocket(`${wsUrl}${endpoint}/subscribe/${topic}`)
}
