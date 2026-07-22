import { Optional } from 'cafe-utility'
import type { BeeRequestOptions, UploadOptions, UploadResult } from '../types'
import { UploadResultBody } from '../types/schema/upload'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'
import { BatchId, EthAddress, Identifier, Reference, Signature } from '../utils/typed-bytes'

const socEndpoint = 'soc'

/**
 * Raw HTTP calls for the `/soc` endpoint.
 */

export async function upload(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  identifier: Identifier,
  signature: Signature,
  data: Uint8Array,
  stamp: BatchId | Uint8Array | string,
  options?: UploadOptions,
): Promise<UploadResult> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: `${socEndpoint}/${owner}/${identifier}`,
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...prepareRequestHeaders(stamp, options),
    },
    responseType: 'json',
    params: { sig: signature.toHex() },
  })

  const body = UploadResultBody.parse(response.data)

  return {
    reference: body.reference,
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address']
      ? Optional.of(new Reference(response.headers['swarm-act-history-address']))
      : Optional.empty(),
  }
}
