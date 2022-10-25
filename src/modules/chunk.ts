import type { BatchId, Data, Ky, Reference, ReferenceOrEns, ReferenceResponse, UploadOptions } from '../types'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { wrapBytesWithHelpers } from '../utils/bytes'

const endpoint = 'chunks'

/**
 * Upload chunk to a Bee node
 *
 * The chunk data consists of 8 byte span and up to 4096 bytes of payload data.
 * The span stores the length of the payload in uint64 little endian encoding.
 * Upload expects the chuck data to be set accordingly.
 *
 * @param ky Ky instance
 * @param data    Chunk data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options Additional options like tag, encryption, pinning
 */
export async function upload(
  ky: Ky,
  data: Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<Reference> {
  const response = await http<ReferenceResponse>(ky, {
    method: 'post',
    path: `${endpoint}`,
    body: data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
    responseType: 'json',
  })

  return response.parsedData.reference
}

/**
 * Download chunk data as a byte array
 *
 * @param ky Ky instance for given Bee class instance
 * @param hash Bee content reference
 *
 */
export async function download(ky: Ky, hash: ReferenceOrEns): Promise<Data> {
  const response = await http<ArrayBuffer>(ky, {
    responseType: 'arraybuffer',
    path: `${endpoint}/${hash}`,
  })

  return wrapBytesWithHelpers(new Uint8Array(response.parsedData))
}
