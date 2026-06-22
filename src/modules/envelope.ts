import type { BeeRequestOptions, EnvelopeWithBatchId } from '../types'
import { PostEnvelopeBodyResponse } from '../types/schema/envelope'
import { http } from '../utils/http'
import { BatchId, Reference } from '../utils/typed-bytes'

const ENVELOPE_ENDPOINT = 'envelope'

export async function postEnvelope(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  reference: Reference,
): Promise<EnvelopeWithBatchId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${ENVELOPE_ENDPOINT}/${reference}`,
    headers: {
      'swarm-postage-batch-id': postageBatchId.toHex(),
    },
  })

  const body = PostEnvelopeBodyResponse.parse(response.data)

  return {
    issuer: body.issuer,
    index: body.index,
    timestamp: body.timestamp,
    signature: body.signature,
    batchId: postageBatchId,
  }
}
