import { Binary, Types } from 'cafe-utility'
import type { BatchId, BeeRequestOptions, Envelope, Reference } from '../types'
import { http } from '../utils/http'

const ENVELOPE_ENDPOINT = 'envelope'

export async function postEnvelope(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  reference: Reference,
): Promise<Envelope> {
  const { data } = await http<Envelope>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${ENVELOPE_ENDPOINT}/${reference}`,
    headers: {
      'swarm-postage-batch-id': postageBatchId,
    },
  })

  return {
    issuer: Binary.hexToUint8Array(Types.asHexString(data.issuer, { name: 'issuer', byteLength: 20 })),
    index: Binary.hexToUint8Array(Types.asHexString(data.index, { name: 'index', byteLength: 8 })),
    timestamp: Binary.hexToUint8Array(Types.asHexString(data.timestamp, { name: 'timestamp', byteLength: 8 })),
    signature: Binary.hexToUint8Array(Types.asHexString(data.signature, { name: 'signature', byteLength: 65 })),
  }
}
