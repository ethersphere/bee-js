import { Binary, Types } from 'cafe-utility'
import type { BeeRequestOptions, EnvelopeWithBatchId } from '../types'
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    issuer: Binary.hexToUint8Array(Types.asHexString(body.issuer, { name: 'issuer', byteLength: 20 })),
    index: Binary.hexToUint8Array(Types.asHexString(body.index, { name: 'index', byteLength: 8 })),
    timestamp: Binary.hexToUint8Array(Types.asHexString(body.timestamp, { name: 'timestamp', byteLength: 8 })),
    signature: Binary.hexToUint8Array(Types.asHexString(body.signature, { name: 'signature', byteLength: 65 })),
    batchId: postageBatchId,
  }
}
