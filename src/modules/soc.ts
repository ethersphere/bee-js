import { Types } from 'cafe-utility'
import { BeeRequestOptions, UploadOptions, UploadResult } from '../types'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'
import { BatchId, EthAddress, Identifier, Reference, Signature } from '../utils/typed-bytes'

const socEndpoint = 'soc'

/**
 * Upload single owner chunk (SOC) to a Bee node
 *
 * @param requestOptions  Options for making requests
 * @param owner           Owner's ethereum address in hex
 * @param identifier      Arbitrary identifier in hex
 * @param signature       Signature in hex
 * @param data            Content addressed chunk data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
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
      ...extractUploadHeaders(stamp, options),
    },
    responseType: 'json',
    params: { sig: signature.toHex() },
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asHexString(body.reference)),
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
    historyAddress: response.headers['swarm-act-history-address'] || '',
  }
}
