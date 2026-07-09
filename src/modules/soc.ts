import { Optional } from 'cafe-utility'
import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData } from '../chunk/soc'
import type { BeeRequestOptions, SOCReader, SOCWriter, UploadOptions, UploadResult } from '../types'
import { UploadResultBody } from '../types/schema/upload'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'
import { BatchId, EthAddress, Identifier, PrivateKey, Reference, Signature } from '../utils/typed-bytes'
import type { BeeContext } from './context'

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

/**
 * Single owner chunk (SOC) reader/writer operations.
 *
 * Accessed as `bee.soc`.
 */
export class Soc {
  constructor(private readonly context: BeeContext) {}

  /**
   * Returns an object for reading single owner chunks.
   *
   * @param ownerAddress The ethereum address of the owner
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  makeReader(ownerAddress: EthAddress | Uint8Array | string, requestOptions?: BeeRequestOptions): SOCReader {
    const owner = new EthAddress(ownerAddress)

    return {
      owner,
      download: downloadSingleOwnerChunk.bind(null, this.context.getRequestOptionsForCall(requestOptions), owner),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks.
   *
   * @param signer The signer's private key. Falls back to the Bee instance signer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  makeWriter(signer?: PrivateKey | Uint8Array | string, requestOptions?: BeeRequestOptions): SOCWriter {
    const key = signer ? new PrivateKey(signer) : this.context.signer

    if (!key) {
      throw Error('No signer provided')
    }

    return {
      ...this.makeReader(key.publicKey().address(), requestOptions),
      upload: uploadSingleOwnerChunkData.bind(null, this.context.getRequestOptionsForCall(requestOptions), key),
    }
  }
}
