import { ReferenceResponse, UploadOptions } from '../types'
import { extractUploadHeaders } from '../utils/headers'
import { safeAxios } from '../utils/safeAxios'

const socEndpoint = '/soc'

/**
 * Upload single owner chunk (SOC) to a Bee node
 *
 * @param url         Bee URL
 * @param owner       Owner's ethereum address in hex
 * @param identifier  Arbitrary identifier in hex
 * @param signature   Signature in hex
 * @param data        Content addressed chunk data to be uploaded
 * @param options     Aditional options like tag, encryption, pinning
 */
export async function upload(
  url: string,
  owner: string,
  identifier: string,
  signature: string,
  data: Uint8Array,
  options?: UploadOptions,
): Promise<ReferenceResponse> {
  const response = await safeAxios<ReferenceResponse>({
    method: 'post',
    url: `${url}${socEndpoint}/${owner}/${identifier}`,
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(options),
    },
    responseType: 'json',
    params: { sig: signature },
  })

  return response.data
}
