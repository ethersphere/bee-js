import { Objects } from 'cafe-utility'
import { Readable } from 'stream'
import { Chunk, makeContentAddressedChunk, unmarshalContentAddressedChunk } from './chunk/cac'
import {
  SingleOwnerChunk,
  downloadSingleOwnerChunk,
  makeSOCAddress,
  makeSingleOwnerChunk,
  unmarshalSingleOwnerChunk,
  uploadSingleOwnerChunkData,
} from './chunk/soc'
import { makeFeedReader, makeFeedWriter } from './feed'
import { areAllSequentialFeedsUpdateRetrievable } from './feed/retrievable'
import * as bytes from './modules/bytes'
import * as bzz from './modules/bzz'
import * as chunk from './modules/chunk'
import { Balance } from './modules/balance'
import type { BeeContext } from './modules/context'
import { Cheque } from './modules/cheque'
import { Chequebook } from './modules/chequebook'
import { Connectivity } from './modules/connectivity'
import { Settlement } from './modules/settlement'
import { Stake } from './modules/stake'
import { Stamp } from './modules/stamp'
import { Storage } from './modules/storage'
import { Status } from './modules/status'
import { Wallet } from './modules/wallet'
import { Transaction } from './modules/transaction'
import { postEnvelope } from './modules/envelope'
import { FeedPayloadResult, createFeedManifest, fetchLatestFeedUpdate } from './modules/feed'
import { Grantee } from './modules/grantee'
import { Messaging } from './modules/messaging'
import { Pin } from './modules/pin'
import { rchash } from './modules/rchash'
import * as stewardship from './modules/stewardship'
import { Tag } from './modules/tag'
import type {
  BeeOptions,
  BeeRequestOptions,
  CollectionUploadOptions,
  DownloadOptions,
  EnvelopeWithBatchId,
  FeedReader,
  FeedWriter,
  FileData,
  FileUploadOptions,
  RedundantUploadOptions,
  ReferenceInformation,
  SOCReader,
  SOCWriter,
  UploadOptions,
} from './types'
import { CHUNK_SIZE, Collection, UploadResult } from './types'
import { Bytes } from './utils/bytes'
import { hashDirectory, streamDirectory, streamFiles } from './utils/chunk-stream'
import { assertCollection, makeCollectionFromFileList } from './utils/collection'
import { makeCollectionFromFS } from './utils/collection.node'
import { BeeArgumentError } from './utils/error'
import { fileArrayBuffer, isFile } from './utils/file'
import { ResourceLocator } from './utils/resource-locator'
import {
  BeeRequestOptionsSchema,
  CollectionUploadOptionsSchema,
  DownloadOptionsSchema,
  FileUploadOptionsSchema,
  RedundantUploadOptionsSchema,
  UploadOptionsSchema,
} from './utils/schema'
import { BZZ } from './utils/tokens'
import { assertData, assertFileData } from './utils/type'
import {
  BatchId,
  EthAddress,
  FeedIndex,
  Identifier,
  PrivateKey,
  Reference,
  Signature,
  Span,
  Topic,
} from './utils/typed-bytes'
import { UploadProgress } from './utils/upload-progress'
import { assertBeeUrl, stripLastSlash } from './utils/url'

/**
 * The main component that abstracts operations available on the Bee API.
 *
 * Instantiate with `new Bee(url, options)` where `url` is the Bee node URL and `options` are optional parameters.
 *
 * @example
 * const bee = new Bee('http://localhost:1633')
 */
export class Bee {
  /**
   * Bee node API URL.
   *
   * @example
   * `http://localhost:1633`
   */
  public readonly url: string

  /**
   * Default signer (a private key) used for signing.
   *
   * Mainly used in single-owner chunk (SOC) related operations, and consequently in feeds.
   *
   * If not provided, methods such as `makeFeedWriter` and `makeSOCWriter`
   * must be provided with a private key in their respective function calls.
   */
  public readonly signer?: PrivateKey

  /**
   * Network on which the Bee node is running.
   *
   * This is currently used to determine block time for postage batch time-to-live (TTL) calculations.
   * The block time for `gnosis` is `5` seconds, and for `sepolia` it is `15` seconds.
   *
   * @default 'gnosis'
   */
  public readonly network: 'gnosis' | 'sepolia'

  /**
   * Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  private readonly requestOptions: BeeRequestOptions

  /**
   * @param url URL on which is the main API of Bee node exposed
   * @param options
   *
   * @example
   * const bee = new Bee('http://localhost:1633')
   */
  constructor(url: string, options?: BeeOptions) {
    assertBeeUrl(url)

    this.url = stripLastSlash(url)

    if (options?.signer) {
      this.signer = new PrivateKey(options.signer)
    }

    this.network = options?.network ?? 'gnosis'

    this.requestOptions = {
      baseURL: this.url,
      timeout: options?.timeout ?? 0,
      headers: options?.headers,
      onRequest: options?.onRequest,
      httpAgent: options?.httpAgent,
      httpsAgent: options?.httpsAgent,
    }

    // Facade handed to each module (namespace) class, exposing only the shared
    // state and helpers they need — without widening the public `bee.` surface.
    const context: BeeContext = {
      getRequestOptionsForCall: requestOptions => this.getRequestOptionsForCall(requestOptions),
      url: this.url,
      signer: this.signer,
      network: this.network,
      bee: this,
    }

    this.balance = new Balance(context)
    this.settlement = new Settlement(context)
    this.transaction = new Transaction(context)
    this.stake = new Stake(context)
    this.connectivity = new Connectivity(context)
    this.status = new Status(context)
    this.wallet = new Wallet(context)
    this.stamp = new Stamp(context)
    this.storage = new Storage(context)
    this.chequebook = new Chequebook(context)
    this.cheque = new Cheque(context)
    this.tag = new Tag(context)
    this.pin = new Pin(context)
    this.grantee = new Grantee(context)
    this.messaging = new Messaging(context)
  }

  /**
   * SWAP balance operations. Related to the bandwidth incentives and the chequebook.
   */
  public readonly balance: Balance

  /**
   * Settlement operations. Related to the bandwidth incentives and the chequebook.
   */
  public readonly settlement: Settlement

  /**
   * Pending transaction operations for the Bee node's transaction queue.
   */
  public readonly transaction: Transaction

  /**
   * Staking operations.
   */
  public readonly stake: Stake

  /**
   * Peer, topology and network connectivity operations.
   */
  public readonly connectivity: Connectivity

  /**
   * Node status, health, version and chain/reserve state operations.
   */
  public readonly status: Status

  /**
   * Node wallet operations (balances and external withdrawals).
   */
  public readonly wallet: Wallet

  /**
   * Low-level postage batch (stamp) operations.
   */
  public readonly stamp: Stamp

  /**
   * Ergonomic storage operations expressed in terms of size and duration.
   */
  public readonly storage: Storage

  /**
   * Chequebook contract operations (address, balance, deposit, withdraw).
   */
  public readonly chequebook: Chequebook

  /**
   * Cheque operations (last cheques and cashouts).
   */
  public readonly cheque: Cheque

  /**
   * Tag operations for tracking upload and synchronization progress.
   */
  public readonly tag: Tag

  /**
   * Local pinning operations.
   */
  public readonly pin: Pin

  /**
   * Grantee (access control) operations.
   */
  public readonly grantee: Grantee

  /**
   * Messaging protocols — PSS and GSOC.
   */
  public readonly messaging: Messaging

  /**
   * Uploads raw data to the network (as opposed to uploading chunks or files).
   *
   * Data uploaded with this method should be retrieved with the {@link downloadData} method.
   *
   * @param postageBatchId Usable Postage Batch ID with sufficient capacity to upload the data.
   * @param data           A `string` (text data) or `Uint8Array` (raw data) to be uploaded.
   * @param options        Additional options like tag, encryption, pinning, content-type and request options.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @returns reference is a content hash of the data
   *
   * @see [Bee API reference - `POST /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes/post)
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   */
  async uploadData(
    postageBatchId: BatchId | Uint8Array | string,
    data: string | Uint8Array,
    options?: RedundantUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    postageBatchId = new BatchId(postageBatchId)
    assertData(data)

    if (options) {
      options = RedundantUploadOptionsSchema.parse(options)
    }

    return bytes.upload(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options)
  }

  /**
   * Fetches content length for a `/bytes` reference.
   *
   * @param reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee API reference - `HEAD /bytes/{reference}`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1%7Breference%7D/head)
   */
  async probeData(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<ReferenceInformation> {
    reference = new Reference(reference)

    return bytes.head(this.getRequestOptionsForCall(requestOptions), reference)
  }

  /**
   * Downloads raw data through the `GET /bytes/{reference}` endpoint.
   *
   * This method may be used to download data that was uploaded with the {@link uploadData} method.
   *
   * For downloading files or using the `GET /bzz/{reference}/` endpoint, use the {@link downloadFile} method instead.
   * For downloading chunks or using the `GET /chunks/{reference} endpoint, use the `downloadChunk` method instead.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   *
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)
   */
  async downloadData(
    resource: Reference | string | Uint8Array,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Bytes> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bytes.download(this.getRequestOptionsForCall(requestOptions), new ResourceLocator(resource), options)
  }

  /**
   * Download raw data through the `GET /bytes/{reference}` endpoint.
   *
   * This method may be used to download data that was uploaded with the {@link uploadData} method.
   *
   * Only tested in Node.js environment.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param options Options that affects the request behavior.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @returns ReadableStream of Uint8Array
   *
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)
   */
  async downloadReadableData(
    resource: Reference | Uint8Array | string,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bytes.downloadReadable(this.getRequestOptionsForCall(requestOptions), new ResourceLocator(resource), options)
  }

  /**
   * Uploads a chunk to the network.
   *
   * Chunks uploaded with this method should be retrieved with the {@link downloadChunk} method.
   *
   * @param stamp Postage Batch ID or an Envelope created with the {@link createEnvelope} method.
   * @param data    Raw chunk to be uploaded (Content Addressed Chunk or Single Owner Chunk)
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @returns reference is a content hash of the data
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `POST /chunks`](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)
   */
  async uploadChunk(
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

    return chunk.upload(this.getRequestOptionsForCall(requestOptions), data, stamp, options)
  }

  /**
   * Downloads a chunk as a `Uint8Array`.
   *
   * May be used to download chunks uploaded with the {@link uploadChunk} method.
   *
   * Use {@link downloadData} method to download raw data uploaded with the {@link uploadData} method.
   * Use {@link downloadFile} method to download files uploaded with the {@link uploadFile} method.
   *
   * @param reference Bee chunk reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /chunks`](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks~1{address}/get)
   */
  async downloadChunk(
    reference: Reference | Uint8Array | string,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Uint8Array> {
    reference = new Reference(reference)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return chunk.download(this.getRequestOptionsForCall(requestOptions), reference, options)
  }

  /**
   * Uploads a single file to a Bee node.
   *
   * To download the file, use the {@link downloadFile} method.
   *
   * Use {@link uploadData} method to upload raw data that can be downloaded with the {@link downloadData} method.
   * Use {@link uploadChunk} method to upload chunks that can be downloaded with the {@link downloadChunk} method.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Optional name of the uploaded file
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   * @returns reference is a content hash of the file
   */
  async uploadFile(
    postageBatchId: BatchId | Uint8Array | string,
    data: string | Uint8Array | Readable | File,
    name?: string,
    options?: FileUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    postageBatchId = new BatchId(postageBatchId)
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
        this.getRequestOptionsForCall(requestOptions),
        fileData,
        postageBatchId,
        fileName,
        fileOptions,
      )
    } else {
      return bzz.uploadFile(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, name, options)
    }
  }

  /**
   * Downloads a single file.
   *
   * @param resource Swarm reference, Swarm CID, or ENS domain.
   * @param path If reference points to manifest, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1%7Breference%7D~1%7Bpath%7D/get)
   */
  async downloadFile(
    resource: Reference | Uint8Array | string,
    path = '',
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<FileData<Bytes>> {
    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bzz.downloadFile(this.getRequestOptionsForCall(requestOptions), new ResourceLocator(resource), path, options)
  }

  /**
   * Download single file as a readable stream
   *
   * @param reference Bee file reference in hex string (either 64 or 128 chars long), ENS domain or Swarm CID.
   * @param path If reference points to manifest / collections, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1%7Breference%7D~1%7Bpath%7D/get)
   */
  async downloadReadableFile(
    reference: Reference | Uint8Array | string,
    path = '',
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<FileData<ReadableStream<Uint8Array>>> {
    reference = new Reference(reference)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    return bzz.downloadFileReadable(this.getRequestOptionsForCall(requestOptions), reference, path, options)
  }

  /**
   * Upload collection of files to a Bee node
   *
   * Uses the FileList API from the browser.
   *
   * The returned `UploadResult.tag` might be undefined if called in CORS-enabled environment.
   * This will be fixed upon next Bee release. https://github.com/ethersphere/bee-js/issues/406
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param fileList list of files to be uploaded
   * @param options Additional options like tag, encryption, pinning and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee docs - Upload directory](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download#upload-a-directory)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  async uploadFiles(
    postageBatchId: BatchId | Uint8Array | string,
    fileList: FileList | File[],
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    postageBatchId = new BatchId(postageBatchId)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    const data = makeCollectionFromFileList(fileList)

    return bzz.uploadCollection(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options)
  }

  /**
   * Hashes a directory locally and returns the root hash (Swarm reference).
   *
   * The actual Swarm reference may be different as there is no canonical hashing of directories.
   * For example, metadata may have different casing, or the order of metadata may differ.
   * Such small differences will result in different Swarm references.
   *
   * Different implementations of the Mantaray structure may also result in different Swarm references.
   *
   * @param dir
   * @returns
   */
  async hashDirectory(dir: string) {
    return hashDirectory(dir)
  }

  /**
   * Uploads a directory to the network. The difference between this method and {@link uploadFilesFromDirectory} is that
   * this method streams the directory contents directly to the Bee node, which supports arbitrary directory sizes,
   * but may be slower due to uploading chunks one by one.
   *
   * Options such as encryption, erasure coding and ACT are not yet available for this method.
   *
   * Only intended for the Node.js environment.
   *
   * @param postageBatchId
   * @param dir
   * @param onUploadProgress
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async streamDirectory(
    postageBatchId: BatchId | Uint8Array | string,
    dir: string,
    onUploadProgress?: (progress: UploadProgress) => void,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ) {
    postageBatchId = new BatchId(postageBatchId)

    return streamDirectory(
      this,
      dir,
      postageBatchId,
      onUploadProgress,
      options,
      this.getRequestOptionsForCall(requestOptions),
    )
  }

  /**
   * Uploads a collection of files to the network. The difference between this method and {@link uploadFiles} is that
   * this method streams the files to the Bee node, which supports arbitrary sizes,
   * but may be slower due to uploading chunks one by one.
   *
   * Options such as encryption, erasure coding and ACT are not yet available for this method.
   *
   * Only intended for the browser environment.
   *
   * @param postageBatchId
   * @param files
   * @param onUploadProgress
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async streamFiles(
    postageBatchId: BatchId | Uint8Array | string,
    files: File[] | FileList,
    onUploadProgress?: (progress: UploadProgress) => void,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ) {
    postageBatchId = new BatchId(postageBatchId)

    return streamFiles(
      this,
      files,
      postageBatchId,
      onUploadProgress,
      options,
      this.getRequestOptionsForCall(requestOptions),
    )
  }

  /**
   * Upload Collection that you can assembly yourself.
   *
   * The returned `UploadResult.tag` might be undefined if called in CORS-enabled environment.
   * This will be fixed upon next Bee release. https://github.com/ethersphere/bee-js/issues/406
   *
   * @param postageBatchId
   * @param collection
   * @param options Collections and request options
   */
  async uploadCollection(
    postageBatchId: BatchId | Uint8Array | string,
    collection: Collection,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    postageBatchId = new BatchId(postageBatchId)
    assertCollection(collection)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    return bzz.uploadCollection(this.getRequestOptionsForCall(requestOptions), collection, postageBatchId, options)
  }

  /**
   * Upload collection of files.
   *
   * Available only in Node.js as it uses the `fs` module.
   *
   * The returned `UploadResult.tag` might be undefined if called in CORS-enabled environment.
   * This will be fixed upon next Bee release. https://github.com/ethersphere/bee-js/issues/406
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param dir the path of the files to be uploaded
   * @param options Additional options like tag, encryption, pinning and request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee docs - Upload directory](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download#upload-a-directory)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)
   */
  async uploadFilesFromDirectory(
    postageBatchId: BatchId | Uint8Array | string,
    dir: string,
    options?: CollectionUploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    postageBatchId = new BatchId(postageBatchId)

    if (options) {
      options = CollectionUploadOptionsSchema.parse(options)
    }

    const data = await makeCollectionFromFS(dir)

    return bzz.uploadCollection(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options)
  }

  /**
   * Checks if content specified by reference is retrievable from the network.
   *
   * @param reference Bee data reference to be checked in hex string (either 64 or 128 chars long) or ENS domain.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee API reference - `GET /stewardship`](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1{reference}/get)
   */
  async isReferenceRetrievable(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<boolean> {
    reference = new Reference(reference)

    return stewardship.isRetrievable(this.getRequestOptionsForCall(requestOptions), reference)
  }

  /**
   * Functions that validate if feed is retrievable in the network.
   *
   * If no index is passed then it check for "latest" update, which is a weaker guarantee as nobody can be really
   * sure what is the "latest" update.
   *
   * If index is passed then it validates all previous sequence index chunks if they are available as they are required
   * to correctly resolve the feed upto the given index update.
   *
   * @param type
   * @param owner
   * @param topic
   * @param index
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isFeedRetrievable(
    owner: EthAddress | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    index?: FeedIndex,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<boolean> {
    owner = new EthAddress(owner)
    topic = new Topic(topic)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    if (!index) {
      try {
        await this.makeFeedReader(topic, owner, requestOptions).download()

        return true
      } catch (e: unknown) {
        const status = Objects.getDeep(e, 'status')

        if (status === 404 || status === 500) {
          return false
        }

        throw e
      }
    }

    return areAllSequentialFeedsUpdateRetrievable(
      this,
      owner,
      topic,
      index,
      options,
      this.getRequestOptionsForCall(requestOptions),
    )
  }

  /**
   * Creates a feed manifest chunk and returns the reference to it.
   *
   * Feed manifest chunks allow for a feed to be able to be resolved through `/bzz` endpoint.
   *
   * @param postageBatchId  Postage BatchId to be used to create the Feed Manifest
   * @param topic           Topic in hex or bytes
   * @param owner           Owner's ethereum address in hex or bytes
   * @param options Options that affects the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/develop/tools-and-features/feeds)
   * @see [Bee API reference - `POST /feeds`](https://docs.ethswarm.org/api/#tag/Feed/paths/~1feeds~1{owner}~1{topic}/post)
   */
  async createFeedManifest(
    postageBatchId: BatchId | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Reference> {
    postageBatchId = new BatchId(postageBatchId)
    topic = new Topic(topic)
    owner = new EthAddress(owner)

    if (options) {
      options = UploadOptionsSchema.parse(options)
    }

    return createFeedManifest(this.getRequestOptionsForCall(requestOptions), owner, topic, postageBatchId, options)
  }

  /**
   * Makes a new feed reader for downloading feed updates.
   *
   * @param topic   Topic in hex or bytes
   * @param owner   Owner's ethereum address in hex or bytes
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/develop/tools-and-features/feeds)
   */
  makeFeedReader(
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): FeedReader {
    topic = new Topic(topic)
    owner = new EthAddress(owner)

    return makeFeedReader(this.getRequestOptionsForCall(requestOptions), topic, owner)
  }

  /**
   * Makes a new feed writer for updating feeds
   *
   * @param topic   Topic in hex or bytes
   * @param signer  The signer's private key or a Signer instance that can sign data
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/develop/tools-and-features/feeds)
   */
  makeFeedWriter(
    topic: Topic | Uint8Array | string,
    signer?: PrivateKey | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): FeedWriter {
    topic = new Topic(topic)
    signer = signer ? new PrivateKey(signer) : this.signer

    if (!signer) {
      throw Error('No signer provided')
    }

    return makeFeedWriter(this.getRequestOptionsForCall(requestOptions), topic, signer)
  }

  async fetchLatestFeedUpdate(
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<FeedPayloadResult> {
    topic = new Topic(topic)
    owner = new EthAddress(owner)

    return fetchLatestFeedUpdate(this.getRequestOptionsForCall(requestOptions), owner, topic)
  }

  /**
   * Creates a Content Addressed Chunk.
   *
   * To be uploaded with the {@link uploadChunk} method.
   *
   * Payload size must be between 1 and 4096 bytes.
   *
   * @param rawPayload Data to be stored in the chunk. If the data is a string, it will be converted to UTF-8 bytes.
   * @param span       Optional span for the chunk. If not provided, it will be set to the length of the payload.
   */
  makeContentAddressedChunk(rawPayload: Bytes | Uint8Array | string, span?: Span | bigint): Chunk {
    return makeContentAddressedChunk(rawPayload, span)
  }

  /**
   * Attempts to unmarshal arbitrary data into a Content Addressed Chunk.
   * Throws an error if the data is not a valid CAC.
   *
   * @param data The chunk data (`span` and `payload`)
   */
  unmarshalContentAddressedChunk(data: Bytes | Uint8Array): Chunk {
    return unmarshalContentAddressedChunk(data)
  }

  /**
   * Creates a Single Owner Chunk.
   *
   * To be uploaded with the {@link uploadChunk} method.
   *
   * Identical to chaining `makeContentAddressedChunk` and `toSingleOwnerChunk`.
   *
   * Payload size must be between 1 and 4096 bytes.
   *
   * @param address     Address of the Content Addressed Chunk
   * @param span        Span of the Content Addressed Chunk
   * @param payload     Payload of the Content Addressed Chunk
   * @param identifier  The identifier of the chunk
   * @param signer      The signer interface for signing the chunk
   */
  makeSingleOwnerChunk(
    address: Reference,
    span: Span,
    payload: Bytes,
    identifier: Identifier | Uint8Array | string,
    signer: PrivateKey | Uint8Array | string,
  ): SingleOwnerChunk {
    return makeSingleOwnerChunk(address, span, payload, identifier, signer)
  }

  /**
   * Calculates the address of a Single Owner Chunk based on its identifier and owner address.
   *
   * @param identifier
   * @param address
   */
  calculateSingleOwnerChunkAddress(identifier: Identifier, address: EthAddress): Reference {
    return makeSOCAddress(identifier, address)
  }

  /**
   * Attempts to unmarshal arbitrary data into a Single Owner Chunk.
   * Throws an error if the data is not a valid SOC.
   *
   * @param data    The chunk data
   * @param address The address of the single owner chunk
   *
   * @returns a single owner chunk or throws error
   */
  unmarshalSingleOwnerChunk(data: Bytes | Uint8Array, address: Reference | Uint8Array | string): SingleOwnerChunk {
    return unmarshalSingleOwnerChunk(data, address)
  }

  /**
   * Returns an object for reading single owner chunks
   *
   * @param ownerAddress The ethereum address of the owner
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/develop/tools-and-features/chunk-types#single-owner-chunks)
   */
  makeSOCReader(ownerAddress: EthAddress | Uint8Array | string, requestOptions?: BeeRequestOptions): SOCReader {
    ownerAddress = new EthAddress(ownerAddress)

    return {
      owner: ownerAddress,
      download: downloadSingleOwnerChunk.bind(null, this.getRequestOptionsForCall(requestOptions), ownerAddress),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks
   *
   * @param signer The signer's private key or a Signer instance that can sign data
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/develop/tools-and-features/chunk-types#single-owner-chunks)
   */
  makeSOCWriter(signer?: PrivateKey | Uint8Array | string, requestOptions?: BeeRequestOptions): SOCWriter {
    signer = signer ? new PrivateKey(signer) : this.signer

    if (!signer) {
      throw Error('No signer provided')
    }

    return {
      ...this.makeSOCReader((signer as PrivateKey).publicKey().address(), requestOptions),
      upload: uploadSingleOwnerChunkData.bind(null, this.getRequestOptionsForCall(requestOptions), signer),
    }
  }

  /**
   * Creates the postage batch signature for a specific chunk address.
   *
   * This is for advanced usage, where a pre-signed chunk can be uploaded
   * through a different Bee node.
   *
   * @param postageBatchId
   * @param reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @example
   * const envelope = await bee.createEnvelope(batchId, chunk.address)
   * await bee.uploadChunk(envelope, chunk)
   *
   * @returns
   */
  async createEnvelope(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<EnvelopeWithBatchId> {
    postageBatchId = new BatchId(postageBatchId)
    reference = new Reference(reference)

    return postEnvelope(this.getRequestOptionsForCall(requestOptions), postageBatchId, reference)
  }

  /**
   * Gets reserve commitment hash duration seconds.
   *
   * To be able to participe in the storage incentives and not get frozen, this should
   * ideally run under 5 minutes.
   *
   * This is a CPU intensice operation, as roughly 2^22 chunks are hashed in the process.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @example
   * const addresses = await bee.connectivity.getNodeAddresses()
   * const topology = await bee.connectivity.getTopology()
   * const result = await bee.rchash(topology.depth, addresses.overlay.toHex(), addresses.overlay.toHex())
   * // result is a number of seconds
   */
  async rchash(depth: number, anchor1: string, anchor2: string, requestOptions?: BeeRequestOptions): Promise<number> {
    return rchash(this.getRequestOptionsForCall(requestOptions), depth, anchor1, anchor2)
  }

  /**
   * Merges per-call request options with the instance defaults.
   *
   * Stays `protected`; module namespaces reach it only through the {@link BeeContext}
   * facade they are constructed with, so it never widens the public `bee.` surface.
   */
  protected getRequestOptionsForCall(requestOptions?: BeeRequestOptions): BeeRequestOptions {
    if (requestOptions) {
      requestOptions = BeeRequestOptionsSchema.parse(requestOptions)
    }

    return requestOptions ? Objects.deepMerge2(this.requestOptions, requestOptions) : this.requestOptions
  }
}
