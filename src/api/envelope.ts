import { BatchId, EthAddress, Reference, Signature } from '@ethersphere/core-sdk'
import type { BeeRequestOptions, EnvelopeWithBatchId } from '../types/index.js'
import { PostEnvelopeBodyResponse } from '../types/schema/envelope.js'
import { http } from '../utils/http.js'

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
    issuer: new EthAddress(body.issuer),
    index: body.index,
    timestamp: body.timestamp,
    signature: new Signature(body.signature),
    batchId: postageBatchId,
  }
}
