import type {
  BatchId,
  BeeRequestOptions,
  Data,
  Reference,
  ReferenceOrEns,
  ReferenceResponse,
  UploadOptions,
} from '../types'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'

const endpoint = 'chunks'

/**
 * Upload chunk to a Bee node
 *
 * The chunk data consists of 8 byte span and up to 4096 bytes of payload data.
 * The span stores the length of the payload in uint64 little endian encoding.
 * Upload expects the chuck data to be set accordingly.
 *
 * @param requestOptions Options for making requests
 * @param data    Chunk data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options Additional options like tag, encryption, pinning
 */
export async function upload(
  requestOptions: BeeRequestOptions,
  data: Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<Reference> {
  const response = await http<ReferenceResponse>(requestOptions, {
    method: 'post',
    url: `${endpoint}`,
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
    responseType: 'json',
  })

  return response.data.reference
}

/**
 * Download chunk data as a byte array
 *
 * @param requestOptions Options for making requests
 * @param hash Bee content reference
 *
 */
export async function download(requestOptions: BeeRequestOptions, hash: ReferenceOrEns): Promise<Data> {
  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${endpoint}/${hash}`,
  })

  return wrapBytesWithHelpers(new Uint8Array(response.data))
}
