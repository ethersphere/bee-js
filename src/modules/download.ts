import type { BeeRequestOptions, DownloadOptions, FileData } from '../types'
import { Bytes } from '../utils/bytes'
import { ResourceLocator } from '../utils/resource-locator'
import { DownloadOptionsSchema } from '../utils/schema'
import { Reference } from '../utils/typed-bytes'
import * as bytes from './bytes'
import * as bzz from './bzz'
import * as chunk from './chunk'
import type { BeeContext } from './context'
import * as stewardship from './stewardship'

/**
 * Download operations for data, chunks and files.
 *
 * Accessed as `bee.download`.
 */
export class Download {
  constructor(private readonly context: BeeContext) {}

  /**
   * Downloads raw data through the `GET /bytes/{reference}` endpoint.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async data(
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
  async readableData(
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
   * Downloads a chunk as a `Uint8Array`.
   *
   * @param reference Bee chunk reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async chunk(
    reference: Reference | Uint8Array | string,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Uint8Array> {
    const ref = new Reference(reference)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return chunk.download(this.context.getRequestOptionsForCall(requestOptions), ref, options)
  }

  /**
   * Downloads a single file.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param path If reference points to manifest, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async file(
    resource: Reference | Uint8Array | string,
    path = '',
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<FileData<Bytes>> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bzz.downloadFile(
      this.context.getRequestOptionsForCall(requestOptions),
      new ResourceLocator(resource),
      path,
      options,
    )
  }

  /**
   * Downloads a single file as a readable stream.
   *
   * @param reference Bee file reference in hex string (either 64 or 128 chars long), ENS domain or Swarm CID.
   * @param path If reference points to manifest / collections, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async readableFile(
    reference: Reference | Uint8Array | string,
    path = '',
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<FileData<ReadableStream<Uint8Array>>> {
    const ref = new Reference(reference)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bzz.downloadFileReadable(this.context.getRequestOptionsForCall(requestOptions), ref, path, options)
  }

  /**
   * Checks if content specified by reference is retrievable from the network.
   *
   * @param reference Bee data reference to be checked in hex string (either 64 or 128 chars long) or ENS domain.
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
