import { Readable } from 'stream'
import { Chunk } from '../chunk/cac'
import { SingleOwnerChunk } from '../chunk/soc'
import type {
  BeeRequestOptions,
  CollectionUploadOptions,
  EnvelopeWithBatchId,
  FileUploadOptions,
  RedundantUploadOptions,
  ReferenceInformation,
  UploadOptions,
} from '../types'
import { CHUNK_SIZE, Collection, UploadResult } from '../types'
import {
  hashDirectory as hashDirectoryImpl,
  streamDirectory as streamDirectoryImpl,
  streamFiles as streamFilesImpl,
} from '../utils/chunk-stream'
import { assertCollection, makeCollectionFromFileList } from '../utils/collection'
import { makeCollectionFromFS } from '../utils/collection.node'
import { BeeArgumentError } from '../utils/error'
import { fileArrayBuffer, isFile } from '../utils/file'
import {
  CollectionUploadOptionsSchema,
  FileUploadOptionsSchema,
  RedundantUploadOptionsSchema,
  UploadOptionsSchema,
} from '../utils/schema'
import { assertData, assertFileData } from '../utils/type'
import { BatchId, Identifier, Reference, Signature, Span } from '../utils/typed-bytes'
import { UploadProgress } from '../utils/upload-progress'
import * as bytes from './bytes'
import * as bzz from './bzz'
import * as chunk from './chunk'
import type { BeeContext } from './context'

/**
 * Upload operations for data, chunks, files and collections.
 *
 * Accessed as `bee.upload`.
 */
export class Upload {
  constructor(private readonly context: BeeContext) {}

  /**
   * Uploads raw data through the `POST /bytes` endpoint.
   *
   * Data uploaded with this method should be retrieved with `bee.download.data`.
   *
   * @param postageBatchId Usable Postage Batch ID with sufficient capacity to upload the data.
   * @param data           A `string` (text data) or `Uint8Array` (raw data) to be uploaded.
   * @param options        Additional options like tag, encryption, pinning, content-type and request options.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async data(
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
   * Fetches content length for a `/bytes` reference.
   *
   * @param reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async probeData(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<ReferenceInformation> {
    const ref = new Reference(reference)

    return bytes.head(this.context.getRequestOptionsForCall(requestOptions), ref)
  }

  /**
   * Uploads a chunk to the network.
   *
   * Chunks uploaded with this method should be retrieved with `bee.download.chunk`.
   *
   * @param stamp Postage Batch ID or an Envelope created with the `bee.createEnvelope` method.
   * @param data    Raw chunk to be uploaded (Content Addressed Chunk or Single Owner Chunk)
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async chunk(
    stamp: EnvelopeWithBatchId | BatchId | Uint8Array | string,
    data: Uint8Array | Chunk | SingleOwnerChunk,
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

    return chunk.upload(this.context.getRequestOptionsForCall(requestOptions), data, stamp, options)
  }

  /**
   * Uploads a single file to a Bee node.
   *
   * To download the file, use `bee.download.file`.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Optional name of the uploaded file
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async file(
    postageBatchId: BatchId | Uint8Array | string,
    data: string | Uint8Array | Readable | File,
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

      return bzz.uploadFile(
        this.context.getRequestOptionsForCall(requestOptions),
        fileData,
        batchId,
        fileName,
        fileOptions,
      )
    } else {
      return bzz.uploadFile(this.context.getRequestOptionsForCall(requestOptions), data, batchId, name, options)
    }
  }

  /**
   * Upload collection of files to a Bee node.
   *
   * Uses the FileList API from the browser.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param fileList list of files to be uploaded
   * @param options Additional options like tag, encryption, pinning and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async files(
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

    return bzz.uploadCollection(this.context.getRequestOptionsForCall(requestOptions), data, batchId, options)
  }

  /**
   * Upload Collection that you can assembly yourself.
   *
   * @param postageBatchId
   * @param collection
   * @param options Collections and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async collection(
    postageBatchId: BatchId | Uint8Array | string,
    collection: Collection,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    const batchId = new BatchId(postageBatchId)
    assertCollection(collection)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    return bzz.uploadCollection(this.context.getRequestOptionsForCall(requestOptions), collection, batchId, options)
  }

  /**
   * Upload collection of files.
   *
   * Available only in Node.js as it uses the `fs` module.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param dir the path of the files to be uploaded
   * @param options Additional options like tag, encryption, pinning and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async filesFromDirectory(
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

    return bzz.uploadCollection(this.context.getRequestOptionsForCall(requestOptions), data, batchId, options)
  }

  /**
   * Uploads a directory to the network by streaming its contents directly to the Bee node, which
   * supports arbitrary directory sizes, but may be slower due to uploading chunks one by one.
   *
   * Only intended for the Node.js environment.
   *
   * @param postageBatchId
   * @param dir
   * @param onUploadProgress
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async streamDirectory(
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
   * Uploads a collection of files to the network by streaming them to the Bee node, which supports
   * arbitrary sizes, but may be slower due to uploading chunks one by one.
   *
   * Only intended for the browser environment.
   *
   * @param postageBatchId
   * @param files
   * @param onUploadProgress
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async streamFiles(
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
