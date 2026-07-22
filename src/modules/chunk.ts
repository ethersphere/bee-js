import { Chunk as ContentAddressedChunk } from '../chunk/cac'
import { SingleOwnerChunk } from '../chunk/soc'
import type { BeeRequestOptions, DownloadOptions, EnvelopeWithBatchId, UploadOptions } from '../types'
import { CHUNK_SIZE, UploadResult } from '../types'
import { BeeArgumentError } from '../utils/error'
import { DownloadOptionsSchema, UploadOptionsSchema } from '../utils/schema'
import { BatchId, Identifier, Reference, Signature, Span } from '../utils/typed-bytes'
import * as api from '../api/chunk'
import type { BeeContext } from './context'

/**
 * Chunk operations backed by the `/chunks` endpoint.
 *
 * Accessed as `bee.chunk`.
 */
export class Chunk {
  constructor(private readonly context: BeeContext) {}

  /**
   * Uploads a chunk to the network.
   *
   * Chunks uploaded with this method should be retrieved with {@link download}.
   *
   * @param stamp Postage Batch ID or an Envelope created with the `bee.createEnvelope` method.
   * @param data    Raw chunk to be uploaded (Content Addressed Chunk or Single Owner Chunk)
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async upload(
    stamp: EnvelopeWithBatchId | BatchId | Uint8Array | string,
    data: Uint8Array | ContentAddressedChunk | SingleOwnerChunk,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const isSOC = 'identifier' in data && 'signature' in data && 'owner' in data

    data = data instanceof Uint8Array ? data : data.data

    if (options) {
      options = UploadOptionsSchema.parse(options)
    }

    if (data.length < Span.LENGTH) {
      throw new BeeArgumentError(`Chunk has to have size of at least ${Span.LENGTH}.`, data)
    }

    if (!isSOC && data.length > CHUNK_SIZE + Span.LENGTH) {
      throw new BeeArgumentError(`Content Addressed Chunk must not exceed ${CHUNK_SIZE + Span.LENGTH} bytes.`, data)
    }

    if (isSOC && data.length > CHUNK_SIZE + Span.LENGTH + Signature.LENGTH + Identifier.LENGTH) {
      throw new BeeArgumentError(
        `Single Owner Chunk must not exceed ${CHUNK_SIZE + Span.LENGTH + Signature.LENGTH + Identifier.LENGTH} bytes.`,
        data,
      )
    }

    return api.upload(this.context.getRequestOptionsForCall(requestOptions), data, stamp, options)
  }

  /**
   * Downloads a chunk as a `Uint8Array`.
   *
   * @param reference Bee chunk reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async download(
    reference: Reference | Uint8Array | string,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Uint8Array> {
    const ref = new Reference(reference)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return api.download(this.context.getRequestOptionsForCall(requestOptions), ref, options)
  }
}
