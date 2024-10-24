import { Types } from 'cafe-utility'
import type { BatchId, BeeRequestOptions, Reference } from '../types'
import { http } from '../utils/http'

const ENVELOPE_ENDPOINT = 'envelope'

export interface EnvelopeResponse {
  issuer: string
  index: string
  timestamp: string
  signature: string
}

export async function postEnvelope(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  reference: Reference,
): Promise<EnvelopeResponse> {
  const response = await http<EnvelopeResponse>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${ENVELOPE_ENDPOINT}/${reference}`,
    headers: {
      'swarm-postage-batch-id': postageBatchId,
    },
  })

  return {
    issuer: Types.asHexString(response.data.issuer, { name: 'issuer', byteLength: 20 }),
    index: Types.asHexString(response.data.index, { name: 'index', byteLength: 8 }),
    timestamp: Types.asHexString(response.data.timestamp, { name: 'timestamp', byteLength: 8 }),
    signature: Types.asHexString(response.data.signature, { name: 'signature', byteLength: 65 }),
  }
}
