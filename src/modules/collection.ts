import type { BeeRequestOptions, CollectionUploadOptions, UploadOptions, UploadResult } from '../types'
import { Collection as CollectionData } from '../types'
import {
  hashDirectory as hashDirectoryImpl,
  streamDirectory as streamDirectoryImpl,
  streamFiles as streamFilesImpl,
} from '../utils/chunk-stream'
import { assertCollection, makeCollectionFromFileList } from '../utils/collection'
import { makeCollectionFromFS } from '../utils/collection.node'
import { CollectionUploadOptionsSchema } from '../utils/schema'
import { BatchId } from '../utils/typed-bytes'
import { UploadProgress } from '../utils/upload-progress'
import * as api from '../api/bzz'
import type { BeeContext } from './context'

/**
 * Collection (multi-file) operations backed by the `/bzz` endpoint.
 *
 * Accessed as `bee.collection`.
 */
export class Collection {
  constructor(private readonly context: BeeContext) {}

  /**
   * Uploads a collection that you assemble yourself.
   *
   * @param postageBatchId
   * @param collection
   * @param options Collection and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async upload(
    postageBatchId: BatchId | Uint8Array | string,
    collection: CollectionData,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const batchId = new BatchId(postageBatchId)
    assertCollection(collection)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    return api.uploadCollection(this.context.getRequestOptionsForCall(requestOptions), collection, batchId, options)
  }

  /**
   * Uploads a collection of files using the browser `FileList` API.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param fileList list of files to be uploaded
   * @param options Additional options like tag, encryption, pinning and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async uploadFromFileList(
    postageBatchId: BatchId | Uint8Array | string,
    fileList: FileList | File[],
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const batchId = new BatchId(postageBatchId)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    const data = makeCollectionFromFileList(fileList)

    return api.uploadCollection(this.context.getRequestOptionsForCall(requestOptions), data, batchId, options)
  }

  /**
   * Uploads a collection of files from a directory on the filesystem.
   *
   * Available only in Node.js as it uses the `fs` module.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param dir the path of the files to be uploaded
   * @param options Additional options like tag, encryption, pinning and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async uploadFromDirectory(
    postageBatchId: BatchId | Uint8Array | string,
    dir: string,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const batchId = new BatchId(postageBatchId)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    const data = await makeCollectionFromFS(dir)

    return api.uploadCollection(this.context.getRequestOptionsForCall(requestOptions), data, batchId, options)
  }

  /**
   * Uploads a collection of files by streaming them to the Bee node, which supports arbitrary
   * sizes, but may be slower due to uploading chunks one by one.
   *
   * Only intended for the browser environment.
   *
   * @param postageBatchId
   * @param files
   * @param onUploadProgress
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async stream(
    postageBatchId: BatchId | Uint8Array | string,
    files: File[] | FileList,
    onUploadProgress?: (progress: UploadProgress) => void,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ) {
    const batchId = new BatchId(postageBatchId)

    return streamFilesImpl(
      this.context.bee,
      files,
      batchId,
      onUploadProgress,
      options,
      this.context.getRequestOptionsForCall(requestOptions),
    )
  }

  /**
   * Uploads a directory by streaming its contents directly to the Bee node, which supports
   * arbitrary directory sizes, but may be slower due to uploading chunks one by one.
   *
   * Only intended for the Node.js environment.
   *
   * @param postageBatchId
   * @param dir
   * @param onUploadProgress
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async streamFromDirectory(
    postageBatchId: BatchId | Uint8Array | string,
    dir: string,
    onUploadProgress?: (progress: UploadProgress) => void,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ) {
    const batchId = new BatchId(postageBatchId)

    return streamDirectoryImpl(
      this.context.bee,
      dir,
      batchId,
      onUploadProgress,
      options,
      this.context.getRequestOptionsForCall(requestOptions),
    )
  }

  /**
   * Hashes a directory locally and returns the root hash (Swarm reference).
   *
   * The actual Swarm reference may be different as there is no canonical hashing of directories.
   *
   * @param dir
   */
  async hashDirectory(dir: string) {
    return hashDirectoryImpl(dir)
  }
}
