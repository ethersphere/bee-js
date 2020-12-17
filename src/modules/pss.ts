import { PublicKey } from '../types'
import { prepareData } from '../utils/data'
import { safeAxios } from '../utils/safeAxios'

const endpoint = '/pss'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Response {}

/**
 * Send to recipient or target with Postal Service for Swarm
 *
 * @param url Bee url
 * @param topic Topic name
 * @param target Target message address prefix
 * @param recipient Recipient public key
 *
 */
export async function send(
  url: string,
  topic: string,
  target: string,
  data: string | Uint8Array,
  recipient?: PublicKey,
): Promise<Response> {
  const response = await safeAxios<Response>({
    method: 'post',
    url: `${url}${endpoint}/send/${topic}/${target.slice(0, 4)}`,
    data: await prepareData(data),
    responseType: 'json',
    params: { recipient },
  })

  return response.data
}

/**
 * Subscribe for messages on the given topic
 *
 * @param topic Topic name
 */
export function subscribe(url: string, topic: string): WebSocket {
  return new WebSocket(`${url}${endpoint}/subscribe/${topic}`)
}
