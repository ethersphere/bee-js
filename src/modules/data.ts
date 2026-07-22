import type {
  BeeRequestOptions,
  DownloadOptions,
  RedundantUploadOptions,
  ReferenceInformation,
  UploadResult,
} from '../types'
import { Bytes } from '../utils/bytes'
import { ResourceLocator } from '../utils/resource-locator'
import { DownloadOptionsSchema, RedundantUploadOptionsSchema } from '../utils/schema'
import { assertData } from '../utils/type'
import { BatchId, Reference } from '../utils/typed-bytes'
import * as bytes from '../api/bytes'
import * as stewardship from '../api/stewardship'
import type { BeeContext } from './context'

/**
 * Raw data operations backed by the `/bytes` endpoint.
 *
 * Accessed as `bee.data`.
 */
export class Data {
  constructor(private readonly context: BeeContext) {}

  /**
   * Uploads raw data through the `POST /bytes` endpoint.
   *
   * Data uploaded with this method should be retrieved with {@link download}.
   *
   * @param postageBatchId Usable Postage Batch ID with sufficient capacity to upload the data.
   * @param data           A `string` (text data) or `Uint8Array` (raw data) to be uploaded.
   * @param options        Additional options like tag, encryption, pinning, content-type and request options.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async upload(
    postageBatchId: BatchId | Uint8Array | string,
    data: string | Uint8Array,
    options?: RedundantUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const batchId = new BatchId(postageBatchId)
    assertData(data)

    if (options) {
      options = RedundantUploadOptionsSchema.parse(options)
    }

    return bytes.upload(this.context.getRequestOptionsForCall(requestOptions), data, batchId, options)
  }

  /**
   * Downloads raw data through the `GET /bytes/{reference}` endpoint.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async download(
    resource: Reference | string | Uint8Array,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Bytes> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bytes.download(this.context.getRequestOptionsForCall(requestOptions), new ResourceLocator(resource), options)
  }

  /**
   * Downloads raw data through the `GET /bytes/{reference}` endpoint as a readable stream.
   *
   * Only tested in Node.js environment.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param options Options that affects the request behavior.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async downloadReadable(
    resource: Reference | Uint8Array | string,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bytes.downloadReadable(
      this.context.getRequestOptionsForCall(requestOptions),
      new ResourceLocator(resource),
      options,
    )
  }

  /**
   * Fetches content length for a `/bytes` reference through the `HEAD /bytes/{reference}` endpoint.
   *
   * @param reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async probe(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<ReferenceInformation> {
    const ref = new Reference(reference)

    return bytes.head(this.context.getRequestOptionsForCall(requestOptions), ref)
  }

  /**
   * Checks if content specified by reference is retrievable from the network.
   *
   * @param reference Bee reference to be checked in hex string (either 64 or 128 chars long) or ENS domain.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isRetrievable(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<boolean> {
    const ref = new Reference(reference)

    return stewardship.isRetrievable(this.context.getRequestOptionsForCall(requestOptions), ref)
  }
}
