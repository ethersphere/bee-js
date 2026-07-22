import { Readable } from 'stream'
import type { BeeRequestOptions, DownloadOptions, FileData, FileUploadOptions, UploadResult } from '../types'
import { Bytes } from '../utils/bytes'
import { fileArrayBuffer, isFile } from '../utils/file'
import { ResourceLocator } from '../utils/resource-locator'
import { DownloadOptionsSchema, FileUploadOptionsSchema } from '../utils/schema'
import { assertFileData } from '../utils/type'
import { BatchId, Reference } from '../utils/typed-bytes'
import * as api from '../api/bzz'
import type { BeeContext } from './context'

/**
 * Single-file operations backed by the `/bzz` endpoint.
 *
 * Accessed as `bee.file`.
 */
export class File {
  constructor(private readonly context: BeeContext) {}

  /**
   * Uploads a single file to a Bee node.
   *
   * To download the file, use {@link download}.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Optional name of the uploaded file
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async upload(
    postageBatchId: BatchId | Uint8Array | string,
    data: string | Uint8Array | Readable | globalThis.File,
    name?: string,
    options?: FileUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const batchId = new BatchId(postageBatchId)
    assertFileData(data)

    if (options) {
      options = FileUploadOptionsSchema.parse(options)
    }

    if (name && typeof name !== 'string') {
      throw new TypeError('name has to be string or undefined!')
    }

    if (isFile(data)) {
      const fileData = await fileArrayBuffer(data)
      const fileName = name ?? data.name
      const contentType = data.type
      const fileOptions = { ...options, contentType }

      return api.uploadFile(
        this.context.getRequestOptionsForCall(requestOptions),
        fileData,
        batchId,
        fileName,
        fileOptions,
      )
    } else {
      return api.uploadFile(this.context.getRequestOptionsForCall(requestOptions), data, batchId, name, options)
    }
  }

  /**
   * Downloads a single file.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param path If reference points to manifest, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async download(
    resource: Reference | Uint8Array | string,
    path = '',
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<FileData<Bytes>> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return api.downloadFile(
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
  async downloadReadable(
    reference: Reference | Uint8Array | string,
    path = '',
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<FileData<ReadableStream<Uint8Array>>> {
    const ref = new Reference(reference)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return api.downloadFileReadable(this.context.getRequestOptionsForCall(requestOptions), ref, path, options)
  }
}
