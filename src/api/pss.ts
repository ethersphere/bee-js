import type { BeeRequestOptions } from '../types'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { BatchId, PublicKey, Topic } from '../utils/typed-bytes'

const pssEndpoint = 'pss'

/**
 * Sends a message with the Postal Service for Swarm through the `POST /pss/send` endpoint.
 */
export async function send(
  requestOptions: BeeRequestOptions,
  batchId: BatchId,
  topic: Topic,
  target: string,
  data: string | Uint8Array,
  recipient?: PublicKey,
): Promise<void> {
  await http<unknown>(requestOptions, {
    method: 'post',
    url: `${pssEndpoint}/send/${topic}/${target}`,
    data,
    responseType: 'json',
    params: { recipient },
    headers: prepareRequestHeaders(batchId),
  })
}
