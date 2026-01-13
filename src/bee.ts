import { Binary, Objects, System, Types } from 'cafe-utility'
import { Readable } from 'stream'
import { Chunk, makeContentAddressedChunk } from './chunk/cac'
import {
  SingleOwnerChunk,
  downloadSingleOwnerChunk,
  makeSOCAddress,
  makeSingleOwnerChunk,
  uploadSingleOwnerChunkData,
} from './chunk/soc'
import { makeFeedReader, makeFeedWriter } from './feed'
import { areAllSequentialFeedsUpdateRetrievable } from './feed/retrievable'
import * as bytes from './modules/bytes'
import * as bzz from './modules/bzz'
import * as chunk from './modules/chunk'
import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as connectivity from './modules/debug/connectivity'
import * as settlements from './modules/debug/settlements'
import * as stake from './modules/debug/stake'
import * as stamps from './modules/debug/stamps'
import * as states from './modules/debug/states'
import * as debugStatus from './modules/debug/status'
import * as transactions from './modules/debug/transactions'
import { postEnvelope } from './modules/envelope'
import { FeedPayloadResult, createFeedManifest, fetchLatestFeedUpdate } from './modules/feed'
import * as grantee from './modules/grantee'
import * as gsoc from './modules/gsoc'
import * as pinning from './modules/pinning'
import * as pss from './modules/pss'
import { rchash } from './modules/rchash'
import * as status from './modules/status'
import * as stewardship from './modules/stewardship'
import * as tag from './modules/tag'
import type {
  AllSettlements,
  BalanceResponse,
  BeeOptions,
  BeeRequestOptions,
  BeeVersions,
  ChainState,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  CollectionUploadOptions,
  DebugStatus,
  DownloadOptions,
  EnvelopeWithBatchId,
  FeedReader,
  FeedWriter,
  FileData,
  FileUploadOptions,
  GetGranteesResult,
  GlobalPostageBatch,
  GranteesResult,
  GsocMessageHandler,
  GsocSubscription,
  Health,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NodeAddresses,
  NodeInfo,
  NumberString,
  Peer,
  PeerBalance,
  Pin,
  PingResponse,
  PostageBatch,
  PostageBatchBuckets,
  PssMessageHandler,
  PssSubscription,
  Readiness,
  RedistributionState,
  RedundancyLevel,
  RedundantUploadOptions,
  ReferenceInformation,
  RemovePeerResponse,
  ReserveState,
  SOCReader,
  SOCWriter,
  Settlements,
  Tag,
  Topology,
  TransactionInfo,
  UploadOptions,
  WalletBalance,
} from './types'
import {
  AllTagsOptions,
  CHUNK_SIZE,
  Collection,
  PostageBatchOptions,
  STAMPS_DEPTH_MAX,
  STAMPS_DEPTH_MIN,
  TransactionOptions,
  UploadResult,
} from './types'
import { Bytes } from './utils/bytes'
import { hashDirectory, streamDirectory, streamFiles } from './utils/chunk-stream'
import { assertCollection, makeCollectionFromFileList } from './utils/collection'
import { makeCollectionFromFS } from './utils/collection.node'
import { prepareWebsocketData } from './utils/data'
import { Duration } from './utils/duration'
import { BeeArgumentError, BeeError } from './utils/error'
import { fileArrayBuffer, isFile } from './utils/file'
import { ResourceLocator } from './utils/resource-locator'
import { Size } from './utils/size'
import { getAmountForDuration, getDepthForSize, getStampCost } from './utils/stamps'
import { BZZ, DAI } from './utils/tokens'
import {
  asNumberString,
  assertData,
  assertFileData,
  makeTagUid,
  prepareAllTagsOptions,
  prepareBeeRequestOptions,
  prepareCollectionUploadOptions,
  prepareDownloadOptions,
  prepareFileUploadOptions,
  prepareGsocMessageHandler,
  preparePostageBatchOptions,
  preparePssMessageHandler,
  prepareRedundantUploadOptions,
  prepareTransactionOptions,
  prepareUploadOptions,
} from './utils/type'
import {
  BatchId,
  EthAddress,
  FeedIndex,
  Identifier,
  PeerAddress,
  PrivateKey,
  PublicKey,
  Reference,
  Signature,
  Span,
  Topic,
  TransactionId,
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
  }

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
      options = prepareRedundantUploadOptions(options)
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
      options = prepareDownloadOptions(options)
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
      options = prepareDownloadOptions(options)
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
      options = prepareUploadOptions(options)
    }

    if (data.length < Span.LENGTH) {
      throw new BeeArgumentError(`Chunk has to have size of at least ${Span.LENGTH}.`, data)
    }

    if (!isSOC && data.length > CHUNK_SIZE + Span.LENGTH) {
      throw new BeeArgumentError(`Content Addressed Chunk must not exceed ${CHUNK_SIZE + Span.LENGTH} bytes.`, data)
    }

    if (isSOC && data.length > CHUNK_SIZE + Span.LENGTH + Signature.LENGTH) {
      throw new BeeArgumentError(
        `Single Owner Chunk must not exceed ${CHUNK_SIZE + Span.LENGTH + Signature.LENGTH} bytes.`,
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
      options = prepareDownloadOptions(options)
    }

    return chunk.download(this.getRequestOptionsForCall(requestOptions), reference, options)
  }

  /**
   * Create a grantees list from the given array of public keys.
   *
   * The grantees list can be obtained with the {@link getGrantees} method.
   *
   * @param postageBatchId - The ID of the postage batch.
   * @param grantees - An array of public keys representing the grantees.
   * @param requestOptions - Optional request options.
   * @returns A promise that resolves to a `GranteesResult` object.
   */
  async createGrantees(
    postageBatchId: BatchId | Uint8Array | string,
    grantees: PublicKey[] | Uint8Array[] | string[],
    requestOptions?: BeeRequestOptions,
  ): Promise<GranteesResult> {
    postageBatchId = new BatchId(postageBatchId)
    grantees = grantees.map(x => new PublicKey(x))

    return grantee.createGrantees(this.getRequestOptionsForCall(requestOptions), postageBatchId, grantees)
  }

  /**
   * Retrieves the grantees for a given reference.
   *
   * @param reference - The reference.
   * @param requestOptions - Optional request options.
   * @returns A promise that resolves to a `GetGranteesResult` object.
   */
  async getGrantees(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<GetGranteesResult> {
    reference = new Reference(reference)

    return grantee.getGrantees(reference, this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Updates the grantees of a specific reference and history.
   *
   * @param reference - The reference.
   * @param history - The history.
   * @param postageBatchId - The ID of the postage batch.
   * @param grantees - The grantees.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns A Promise that resolves to to a `GranteesResult` object.
   */
  async patchGrantees(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    history: Reference | Uint8Array | string,
    grantees: { add?: PublicKey[] | Uint8Array[] | string[]; revoke?: PublicKey[] | Uint8Array[] | string[] },
    requestOptions?: BeeRequestOptions,
  ): Promise<GranteesResult> {
    postageBatchId = new BatchId(postageBatchId)
    reference = new Reference(reference)
    history = new Reference(history)

    const publicKeys = {
      add: grantees.add?.map(x => new PublicKey(x)) ?? [],
      revoke: grantees.revoke?.map(x => new PublicKey(x)) ?? [],
    }

    return grantee.patchGrantees(
      postageBatchId,
      reference,
      history,
      publicKeys,
      this.getRequestOptionsForCall(requestOptions),
    )
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
      options = prepareFileUploadOptions(options)
    }

    if (name && typeof name !== 'string') {
      throw new TypeError('name has to be string or undefined!')
    }

    if (isFile(data)) {
      const fileData = await fileArrayBuffer(data)
      const fileName = name ?? data.name
      const contentType = data.type
      const fileOptions = { contentType, ...options }

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
      options = prepareDownloadOptions(options)
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
      options = prepareDownloadOptions(options)
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
      options = prepareCollectionUploadOptions(options)
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
      options = prepareCollectionUploadOptions(options)
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
      options = prepareCollectionUploadOptions(options)
    }

    const data = await makeCollectionFromFS(dir)

    return bzz.uploadCollection(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options)
  }

  /**
   * Creates a new Tag which is meant for tracking upload and synchronization progress.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `POST /tags`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/post)
   */
  async createTag(requestOptions?: BeeRequestOptions): Promise<Tag> {
    return tag.createTag(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Fetches all tags in a paginated manner.
   *
   * The listing is limited by options.limit. So you have to iterate using options.offset to get all tags.
   *
   * @param options Specify `limit` and `offset` to paginate through the tags.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/get)
   */
  async getAllTags(options?: AllTagsOptions, requestOptions?: BeeRequestOptions): Promise<Tag[]> {
    if (options) {
      options = prepareAllTagsOptions(options)
    }

    return tag.getAllTags(this.getRequestOptionsForCall(requestOptions), options?.offset, options?.limit)
  }

  /**
   * Retrieves tag information from Bee node.
   *
   * @param tagUid UID or tag object to be retrieved
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/get)
   *
   */
  async retrieveTag(tagUid: number | Tag, requestOptions?: BeeRequestOptions): Promise<Tag> {
    tagUid = makeTagUid(tagUid)

    return tag.retrieveTag(this.getRequestOptionsForCall(requestOptions), tagUid)
  }

  /**
   * Deletes Tag.
   *
   * @param tagUid UID or tag object to be retrieved
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `DELETE /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/delete)
   */
  async deleteTag(tagUid: number | Tag, requestOptions?: BeeRequestOptions): Promise<void> {
    tagUid = makeTagUid(tagUid)

    return tag.deleteTag(this.getRequestOptionsForCall(requestOptions), tagUid)
  }

  /**
   * Update tag's total chunks count.
   *
   * This is important if you are uploading individual chunks with a tag. Then upon finishing the final root chunk,
   * you can use this method to update the total chunks count for the tag.
   *
   * @param tagUid UID or tag object to be retrieved
   * @param reference The root reference that contains all the chunks to be counted
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `PATCH /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/patch)
   */
  async updateTag(
    tagUid: number | Tag,
    reference: Reference | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    reference = new Reference(reference)

    tagUid = makeTagUid(tagUid)

    return tag.updateTag(this.getRequestOptionsForCall(requestOptions), tagUid, reference)
  }

  /**
   * Pins local data with given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async pin(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<void> {
    reference = new Reference(reference)

    return pinning.pin(this.getRequestOptionsForCall(requestOptions), reference)
  }

  /**
   * Unpins local data with given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async unpin(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<void> {
    reference = new Reference(reference)

    return pinning.unpin(this.getRequestOptionsForCall(requestOptions), reference)
  }

  /**
   * Gets list of all locally pinned references.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async getAllPins(requestOptions?: BeeRequestOptions): Promise<Reference[]> {
    return pinning.getAllPins(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get pinning status of chunk with given reference
   *
   * @param reference Bee data reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async getPin(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<Pin> {
    reference = new Reference(reference)

    return pinning.getPin(this.getRequestOptionsForCall(requestOptions), reference)
  }

  /**
   * Instructs the Bee node to reupload a locally pinned data into the network.
   *
   * @param postageBatchId Postage Batch ID that will be used to re-upload the data.
   * @param reference Bee data reference to be re-uploaded in hex string (either 64 or 128 chars long) or ENS domain.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee API reference - `PUT /stewardship`](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1{reference}/put)
   */
  async reuploadPinnedData(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    postageBatchId = new BatchId(postageBatchId)
    reference = new Reference(reference)

    await stewardship.reupload(this.getRequestOptionsForCall(requestOptions), postageBatchId, reference)
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
      options = prepareDownloadOptions(options)
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
   * Send data to recipient or target with Postal Service for Swarm.
   *
   * Because sending a PSS message is slow and CPU intensive,
   * it is not supposed to be used for general messaging but
   * most likely for setting up an encrypted communication
   * channel by sending an one-off message.
   *
   * **Warning! Only full nodes can accept PSS messages.**
   *
   * @param postageBatchId Postage BatchId that will be assigned to sent message
   * @param topic Topic name
   * @param target Target message address prefix. Has a limit on length. Recommend to use `Utils.Pss.makeMaxTarget()` to get the most specific target that Bee node will accept.
   * @param data Message to be sent
   * @param recipient Recipient public key
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/develop/tools-and-features/pss)
   * @see [Bee API reference - `POST /pss`](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1send~1{topic}~1{targets}/post)
   */
  async pssSend(
    postageBatchId: BatchId | Uint8Array | string,
    topic: Topic,
    target: string,
    data: string | Uint8Array,
    recipient?: string | PublicKey,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    postageBatchId = new BatchId(postageBatchId)
    assertData(data)

    if (recipient) {
      recipient = new PublicKey(recipient)

      return pss.send(this.getRequestOptionsForCall(requestOptions), topic, target, data, postageBatchId, recipient)
    } else {
      return pss.send(this.getRequestOptionsForCall(requestOptions), topic, target, data, postageBatchId)
    }
  }

  /**
   * Subscribes to messages for given topic with the Postal Service for Swarm.
   *
   * **Warning! Only full nodes can accept PSS messages.**
   *
   * @param topic Topic name
   * @param handler Message handler interface
   *
   * @returns Subscription to a given topic
   *
   * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/develop/tools-and-features/pss)
   * @see [Bee API reference - `GET /pss`](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1subscribe~1{topic}/get)
   */
  pssSubscribe(topic: Topic, handler: PssMessageHandler): PssSubscription {
    handler = preparePssMessageHandler(handler)

    const ws = pss.subscribe(this.url, topic, this.requestOptions.headers)

    let cancelled = false
    const cancel = () => {
      if (!cancelled) {
        cancelled = true

        if (ws.terminate) {
          ws.terminate()
        } else {
          ws.close()
        }
      }
    }

    const subscription = {
      topic,
      cancel,
    }

    ws.onmessage = async event => {
      const data = await prepareWebsocketData(event.data)

      if (data.length) {
        handler.onMessage(new Bytes(data), subscription)
      }
    }
    ws.onerror = event => {
      if (!cancelled) {
        handler.onError(new BeeError(event.message), subscription)
      }
    }
    ws.onclose = () => {
      handler.onClose(subscription)
    }

    return subscription
  }

  /**
   * Receives message using the Postal Service for Swarm.
   *
   * This is a helper function to wait for exactly one message to
   * arrive and then cancel the subscription. Additionally a
   * timeout can be provided for the message to arrive or else
   * an error will be thrown.
   *
   * **Warning! Only full nodes can accept PSS messages.**
   *
   * @param topic Topic name
   * @param timeoutMsec Timeout in milliseconds
   *
   * @returns Message in byte array
   *
   * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/develop/tools-and-features/pss)
   * @see [Bee API reference - `GET /pss`](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1subscribe~1{topic}/get)
   */
  async pssReceive(topic: Topic, timeoutMsec = 0): Promise<Bytes> {
    if (typeof timeoutMsec !== 'number') {
      throw new TypeError('timeoutMsc parameter has to be a number!')
    }

    return new Promise((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout> | undefined
      const subscription = this.pssSubscribe(topic, {
        onError: error => {
          clearTimeout(timeout)
          subscription.cancel()
          reject(error.message)
        },
        onMessage: message => {
          clearTimeout(timeout)
          subscription.cancel()
          resolve(message)
        },
        onClose: () => {
          clearTimeout(timeout)
          subscription.cancel()
        },
      })

      if (timeoutMsec > 0) {
        timeout = setTimeout(() => {
          subscription.cancel()
          reject(new BeeError('pssReceive timeout'))
        }, timeoutMsec)
      }
    })
  }

  /**
   * Mines the signer (a private key) to be used to send GSOC messages to the specific target overlay address.
   *
   * Use {@link gsocSend} to send GSOC messages with the mined signer.
   *
   * Use {@link gsocSubscribe} to subscribe to GSOC messages for the specified owner (of the signer) and identifier.
   *
   * See {@link gsocSend} or {@link gsocSubscribe} for concrete examples of usage.
   *
   * **Warning! Only full nodes can accept GSOC messages.**
   *
   * @param targetOverlay
   * @param identifier
   * @param proximity
   * @returns
   */
  gsocMine(
    targetOverlay: PeerAddress | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    proximity = 12,
  ): PrivateKey {
    targetOverlay = new PeerAddress(targetOverlay)
    identifier = new Identifier(identifier)
    const start = 0xb33n
    for (let i = 0n; i < 0xffffn; i++) {
      const signer = new PrivateKey(Binary.numberToUint256(start + i, 'BE'))
      const socAddress = makeSOCAddress(identifier, signer.publicKey().address())
      // TODO: test the significance of the hardcoded 256
      const actualProximity = 256 - Binary.proximity(socAddress.toUint8Array(), targetOverlay.toUint8Array())

      if (actualProximity <= 256 - proximity) {
        return signer
      }
    }
    throw Error('Could not mine a valid signer')
  }

  /**
   * Sends a GSOC message with the specified signer and identifier.
   *
   * Use {@link gsocMine} to mine a signer for the target overlay address.
   *
   * Use {@link gsocSubscribe} to subscribe to GSOC messages for the specified owner (of the signer) and identifier.
   *
   * **Warning! Only full nodes can accept GSOC messages.**
   *
   * @param postageBatchId
   * @param signer
   * @param identifier
   * @param data
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   *
   * @example
   * const identifier = NULL_IDENTIFIER
   * const overlay = '0x1234567890123456789012345678901234567890'
   * const signer = bee.gsocMine(overlay, identifier)
   * await bee.gsocSend(postageBatchId, signer, identifier, 'GSOC!')
   */
  async gsocSend(
    postageBatchId: BatchId | Uint8Array | string,
    signer: PrivateKey | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    data: string | Uint8Array,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ) {
    postageBatchId = new BatchId(postageBatchId)
    signer = new PrivateKey(signer)
    identifier = new Identifier(identifier)

    const cac = makeContentAddressedChunk(data)
    const soc = cac.toSingleOwnerChunk(identifier, signer)

    return gsoc.send(this.getRequestOptionsForCall(requestOptions), soc, postageBatchId, options)
  }

  /**
   * Subscribes to GSOC messages for the specified owner (of the signer) and identifier.
   *
   * Use {@link gsocMine} to mine a signer for the target overlay address.
   *
   * Use {@link gsocSend} to send GSOC messages with the mined signer.
   *
   * **Warning! Only full nodes can accept GSOC messages.**
   *
   * @param address
   * @param identifier
   * @param handler
   * @returns
   *
   * @example
   * const identifier = NULL_IDENTIFIER
   * const { overlay } = await bee.getNodeAddresses()
   * const signer = bee.gsocMine(overlay, identifier)
   *
   * const subscription = bee.gsocSubscribe(signer.publicKey().address(), identifier, {
   *   onMessage(message) {
   *     // handle
   *   },
   *   onError(error) {
   *     // handle
   *   },
   *   onClose() {
   *     // handle
   *   }
   * })
   */
  gsocSubscribe(
    address: EthAddress | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    handler: GsocMessageHandler,
  ): GsocSubscription {
    address = new EthAddress(address)
    identifier = new Identifier(identifier)
    handler = prepareGsocMessageHandler(handler)

    const socAddress = makeSOCAddress(identifier, address)

    const ws = gsoc.subscribe(this.url, socAddress, this.requestOptions.headers)

    let cancelled = false
    const cancel = () => {
      if (!cancelled) {
        cancelled = true

        if (ws.terminate) {
          ws.terminate()
        } else {
          ws.close()
        }
      }
    }

    const subscription = {
      address,
      cancel,
    }

    ws.onmessage = async event => {
      const data = await prepareWebsocketData(event.data)

      if (data.length) {
        handler.onMessage(new Bytes(data), subscription)
      }
    }
    ws.onerror = event => {
      if (!cancelled) {
        handler.onError(new BeeError(event.message), subscription)
      }
    }
    ws.onclose = () => {
      handler.onClose(subscription)
    }

    return subscription
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
      options = prepareUploadOptions(options)
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
   *
   * @example
   *
   */
  makeContentAddressedChunk(rawPayload: Bytes | Uint8Array | string): Chunk {
    return makeContentAddressedChunk(rawPayload)
  }

  /**
   * Creates a Single Owner Chunk.
   *
   * To be uploaded with the {@link uploadChunk} method.
   *
   * Identical to using `makeContentAddressedChunk` and then `toSingleOwnerChunk` method on the returned object.
   *
   * @param chunk       A chunk object used for the span and payload
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
   * const addresses = await bee.getNodeAddresses()
   * const topology = await bee.getTopology()
   * const result = await bee.rchash(topology.depth, addresses.overlay.toHex(), addresses.overlay.toHex())
   * // result is a number of seconds
   */
  async rchash(depth: number, anchor1: string, anchor2: string, requestOptions?: BeeRequestOptions): Promise<number> {
    return rchash(this.getRequestOptionsForCall(requestOptions), depth, anchor1, anchor2)
  }

  /**
   * Pings the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @throws If connection was not successful throw error
   */
  async checkConnection(requestOptions?: BeeRequestOptions): Promise<void> | never {
    return status.checkConnection(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Pings the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns true if successful, false on error
   */
  async isConnected(requestOptions?: BeeRequestOptions): Promise<boolean> {
    try {
      await status.checkConnection(this.getRequestOptionsForCall(requestOptions))
    } catch (e) {
      return false
    }

    return true
  }

  /**
   * Checks the `/gateway` endpoint to see if the remote API is a gateway.
   *
   * Do note that this is not a standard way to check for gateway nodes,
   * but some of the gateway tooling expose this endpoint.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isGateway(requestOptions?: BeeRequestOptions): Promise<boolean> {
    return status.isGateway(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Fetches the overlay, underlay, Ethereum, and other addresses of the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async getNodeAddresses(requestOptions?: BeeRequestOptions): Promise<NodeAddresses> {
    return connectivity.getNodeAddresses(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Fetches the list of blocked peers for this node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async getBlocklist(requestOptions?: BeeRequestOptions): Promise<Peer[]> {
    return connectivity.getBlocklist(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets list of peers for this node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPeers(requestOptions?: BeeRequestOptions): Promise<Peer[]> {
    return connectivity.getPeers(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Disconnects from a specific peer.
   *
   * @param peer Overlay address of the peer to be removed.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async removePeer(peer: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<RemovePeerResponse> {
    peer = new PeerAddress(peer)

    return connectivity.removePeer(this.getRequestOptionsForCall(requestOptions), peer)
  }

  /**
   * Fetches topology and connectivity information of the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async getTopology(requestOptions?: BeeRequestOptions): Promise<Topology> {
    return connectivity.getTopology(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Pings a specific peer to check its availability.
   *
   * @param peer Overlay address of the peer to be pinged.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async pingPeer(peer: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<PingResponse> {
    peer = new PeerAddress(peer)

    return connectivity.pingPeer(this.getRequestOptionsForCall(requestOptions), peer)
  }

  /**
   * Gets the SWAP balances with all known peers including prepaid services.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllBalances(requestOptions?: BeeRequestOptions): Promise<BalanceResponse> {
    return balance.getAllBalances(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the SWAP balances for a specific peer including prepaid services.
   *
   * @param address Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPeerBalance(address: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<PeerBalance> {
    address = new PeerAddress(address)

    return balance.getPeerBalance(this.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Gets the past due consumption balances for all known peers.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPastDueConsumptionBalances(requestOptions?: BeeRequestOptions): Promise<BalanceResponse> {
    return balance.getPastDueConsumptionBalances(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the past due consumption balance for a specific peer.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param address Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPastDueConsumptionPeerBalance(
    address: PeerAddress | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<PeerBalance> {
    address = new PeerAddress(address)

    return balance.getPastDueConsumptionPeerBalance(this.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Gets the address of the deloyed chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChequebookAddress(requestOptions?: BeeRequestOptions): Promise<ChequebookAddressResponse> {
    return chequebook.getChequebookAddress(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the balance of the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChequebookBalance(requestOptions?: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
    return chequebook.getChequebookBalance(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the last cheques for all peers.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getLastCheques(requestOptions?: BeeRequestOptions): Promise<LastChequesResponse> {
    return chequebook.getLastCheques(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the last cheques for a specific peer.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param address Overlay address of peer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getLastChequesForPeer(
    address: PeerAddress | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<LastChequesForPeerResponse> {
    address = new PeerAddress(address)

    return chequebook.getLastChequesForPeer(this.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Gets the last cashout action for a specific peer.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param address Overlay address of peer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getLastCashoutAction(
    address: PeerAddress | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<LastCashoutActionResponse> {
    address = new PeerAddress(address)

    return chequebook.getLastCashoutAction(this.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Cashes out the last cheque for a specific peer.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param address  Swarm address of peer
   * @param options
   * @param options.gasPrice Gas price for the cashout transaction in WEI
   * @param options.gasLimit Gas limit for the cashout transaction in WEI
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async cashoutLastCheque(
    address: PeerAddress | string,
    options?: TransactionOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    address = new PeerAddress(address)

    if (options) {
      prepareTransactionOptions(options)
    }

    return chequebook.cashoutLastCheque(this.getRequestOptionsForCall(requestOptions), address, options)
  }

  /**
   * Deposits tokens from the node wallet into the chequebook.
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @return string  Hash of the transaction
   * @deprecated Use `depositBZZToChequebook` instead.
   */
  async depositTokens(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    return this.depositBZZToChequebook(amount, gasPrice, requestOptions)
  }

  /**
   * Deposits tokens from the node wallet into the chequebook.
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @return string  Hash of the transaction
   */
  async depositBZZToChequebook(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    let gasPriceString

    if (gasPrice) {
      gasPriceString = asNumberString(amount, { min: 0n, name: 'gasPrice' })
    }

    return chequebook.depositTokens(this.getRequestOptionsForCall(requestOptions), amountString, gasPriceString)
  }

  /**
   * Withdraws tokens from the chequebook to the node wallet.
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @return string  Hash of the transaction
   * @deprecated Use `withdrawBZZFromChequebook` instead.
   */
  async withdrawTokens(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    return this.withdrawBZZFromChequebook(amount, gasPrice, requestOptions)
  }

  /**
   * Withdraws tokens from the chequebook to the node wallet.
   *
   * @param amount Amount of BZZ tokens to withdraw. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param gasPrice Gas Price in WEI for the transaction call.
   * @return Transaction ID
   */
  async withdrawBZZFromChequebook(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    // TODO: check BZZ in tests
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    let gasPriceString

    if (gasPrice) {
      gasPriceString = asNumberString(amount, { min: 0n, name: 'gasPrice' })
    }

    return chequebook.withdrawTokens(this.getRequestOptionsForCall(requestOptions), amountString, gasPriceString)
  }

  /**
   * Withdraws BZZ from the node wallet (not chequebook) to a whitelisted external wallet address.
   *
   * @param amount Amount of BZZ tokens to withdraw. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param address
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @return Transaction ID
   */
  async withdrawBZZToExternalWallet(
    amount: BZZ | NumberString | string | bigint,
    address: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    amount = amount instanceof BZZ ? amount : BZZ.fromPLUR(amount)
    address = new EthAddress(address)

    return states.withdrawBZZ(this.getRequestOptionsForCall(requestOptions), amount, address)
  }

  /**
   * Withdraws DAI from the node wallet (not chequebook) to a whitelisted external wallet address.
   *
   * @param amount Amount of DAI tokens to withdraw. If not providing a `DAI` instance, the amount is denoted in wei.
   * @param address
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @return Transaction ID
   */
  async withdrawDAIToExternalWallet(
    amount: DAI | NumberString | string | bigint,
    address: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    amount = amount instanceof DAI ? amount : DAI.fromWei(amount)
    address = new EthAddress(address)

    return states.withdrawDAI(this.getRequestOptionsForCall(requestOptions), amount, address)
  }

  /**
   * Gets the amount of sent and received micropayments from settlements with a peer.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param address  Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getSettlements(address: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<Settlements> {
    address = new PeerAddress(address)

    return settlements.getSettlements(this.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Gets settlements with all known peers and total amount sent or received.
   *
   * This is related to the bandwidth incentives and the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllSettlements(requestOptions?: BeeRequestOptions): Promise<AllSettlements> {
    return settlements.getAllSettlements(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the general status of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getStatus(requestOptions?: BeeRequestOptions): Promise<DebugStatus> {
    return debugStatus.getDebugStatus(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the health of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getHealth(requestOptions?: BeeRequestOptions): Promise<Health> {
    return debugStatus.getHealth(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the readiness status of the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getReadiness(requestOptions?: BeeRequestOptions): Promise<Readiness> {
    return debugStatus.getReadiness(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get mode information of node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getNodeInfo(requestOptions?: BeeRequestOptions): Promise<NodeInfo> {
    return debugStatus.getNodeInfo(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Connects to a node and checks if its version matches with the one that bee-js supports.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isSupportedExactVersion(requestOptions?: BeeRequestOptions): Promise<boolean> | never {
    return debugStatus.isSupportedExactVersion(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   *
   * Connects to a node and checks if its Main API version matches with the one that bee-js supports.
   *
   * This should be the main way how to check compatibility for your app and Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isSupportedApiVersion(requestOptions?: BeeRequestOptions): Promise<boolean> | never {
    return debugStatus.isSupportedApiVersion(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Returns object with all versions specified by the connected Bee node (properties prefixed with `bee*`)
   * and versions that bee-js supports (properties prefixed with `supported*`).
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getVersions(requestOptions?: BeeRequestOptions): Promise<BeeVersions> | never {
    return debugStatus.getVersions(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get reserve state.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getReserveState(requestOptions?: BeeRequestOptions): Promise<ReserveState> {
    return states.getReserveState(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets chain state.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChainState(requestOptions?: BeeRequestOptions): Promise<ChainState> {
    return states.getChainState(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets DAI and BZZ balances of the Bee node wallet.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getWalletBalance(requestOptions?: BeeRequestOptions): Promise<WalletBalance> {
    return states.getWalletBalance(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Creates a new postage batch, spending BZZ tokens from the node wallet.
   *
   * Use {@link buyStorage} for a more convenient way to create postage batch.
   *
   * For better understanding what each parameter means and what the optimal values are, see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction#keep-your-data-alive).
   *
   * @param amount TTL parameter - 1 day at the minimum of 24,000 storage price requires an amount of 414,720,000.
   * @param depth Capacity parameter - 17..255 - depth 17 provides 512MB of theoretical capacity, 18 provides 1GB, 19 provides 2GB, etc.
   * @param options Options for creation of postage batch
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `POST /stamps`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1{amount}~1{depth}/post)
   */
  async createPostageBatch(
    amount: NumberString | string | bigint,
    depth: number,
    options?: PostageBatchOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    const amountString = asNumberString(amount, { min: 0n, name: 'amount' })

    if (options) {
      options = preparePostageBatchOptions(options)
    }

    if (depth < STAMPS_DEPTH_MIN || depth > STAMPS_DEPTH_MAX) {
      throw new BeeArgumentError(`Depth has to be between ${STAMPS_DEPTH_MIN}..${STAMPS_DEPTH_MAX}`, depth)
    }

    const chainState = await this.getChainState()
    const minimumAmount = BigInt(chainState.currentPrice) * 17280n + 1n

    if (BigInt(amountString) < minimumAmount) {
      throw new BeeArgumentError(
        `Amount has to be at least ${minimumAmount} (1 day at current price ${chainState.currentPrice})`,
        amountString,
      )
    }

    const stamp = await stamps.createPostageBatch(
      this.getRequestOptionsForCall(requestOptions),
      amountString,
      depth,
      options,
    )

    if (options?.waitForUsable !== false) {
      await this.waitForUsablePostageStamp(stamp, options?.waitForUsableTimeout)
    }

    return stamp
  }

  /**
   * A more convenient method to create a postage batch, which is analogous
   * to buying storage for a certain size and duration on the Swarm network.
   *
   * Use {@link getStorageCost} to calculate the cost of creating a postage batch.
   * 
   * For the low level API, use {@link createPostageBatch}.
   * 
   * @example const batchId = await bee.buyStorage(Size.fromGigabytes(8), Duration.fromDays(31))

   * @param size
   * @param duration
   * @param options
   * @param requestOptions
   * @param encryption
   * @param erasureCodeLevel
   * @returns
   */
  async buyStorage(
    size: Size,
    duration: Duration,
    options?: PostageBatchOptions,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BatchId> {
    const chainState = await this.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.network === 'gnosis' ? 5 : 15)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)

    if (options) {
      options = preparePostageBatchOptions(options)
    }

    return this.createPostageBatch(amount, depth, options, requestOptions)
  }

  /**
   * Calculates the estimated BZZ cost for creating a postage batch for the given size and duration.
   *
   * Use {@link buyStorage} to create a postage batch with the calculated cost.
   *
   * @example const bzz = await bee.getStorageCost(Size.fromGigabytes(1), Duration.fromDays(30))
   *
   * @param size Size of the data to be stored.
   * @param duration Duration for which the data should be stored.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   * @returns
   */
  async getStorageCost(
    size: Size,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const chainState = await this.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.network === 'gnosis' ? 5 : 15)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)

    return getStampCost(depth, amount)
  }

  /**
   * Extends the storage of a postage batch by either increasing its size, duration or both.
   *
   * The size is ABSOLUTE, while the duration is RELATIVE to the current duration of the postage batch.
   *
   * Use {@link getExtensionCost} to calculate the cost of extending the storage.
   *
   * @example
   * // Increases the size to 8GB (unless it is already at 8GB or higher)
   * // and extends the duration by 30 days (regardless of the current duration).
   * await bee.extendStorage(batchId, Size.fromGigabytes(8), Duration.fromDays(30))
   *
   * @example
   * // To increase the duration to a desired date, pass a second parameter to `Duration.fromEndDate`.
   * // With the second parameter, the duration is set to the difference between the current end date and the desired end date.
   * const oneMonth = new Date(Date.now() + Dates.days(31))
   * const batch = await bee.getPostageBatch(batchId)
   * await bee.extendStorage(batchId, Size.fromGigabytes(8), Duration.fromEndDate(oneMonth, batch.duration.toEndDate()))
   *
   * @param postageBatchId Batch ID of the postage batch to extend.
   * @param size Absolute size to extend the postage batch to.
   * @param duration Relative duration to extend the postage batch by.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   * @returns
   */
  async extendStorage(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ) {
    const batch = await this.getPostageBatch(postageBatchId, requestOptions)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)
    const chainState = await this.getChainState(requestOptions)
    const depthDelta = depth - batch.depth
    const multiplier = depthDelta <= 0 ? 1n : 2n ** BigInt(depthDelta)
    const blockTime = this.network === 'gnosis' ? 5 : 15
    const additionalAmount = getAmountForDuration(duration, chainState.currentPrice, blockTime)
    const currentAmount = getAmountForDuration(batch.duration, chainState.currentPrice, blockTime)
    const targetAmount = duration.isZero() ? currentAmount * multiplier : currentAmount + additionalAmount * multiplier

    const amountDelta = targetAmount - currentAmount

    const transactionId = await this.topUpBatch(batch.batchID, amountDelta, requestOptions)

    if (depthDelta > 0) {
      return this.diluteBatch(batch.batchID, depth, requestOptions)
    }

    return transactionId
  }

  /**
   * Extends the storage size of a postage batch by increasing its depth.
   *
   * Use {@link getSizeExtensionCost} to calculate the cost of extending the size.
   * Use {@link extendStorage} to extend both size and duration.
   *
   * @param postageBatchId
   * @param size Absolute size to extend the postage batch to.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   * @returns
   */
  async extendStorageSize(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ) {
    const chainState = await this.getChainState(requestOptions)
    const batch = await this.getPostageBatch(postageBatchId, requestOptions)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)
    const delta = depth - batch.depth

    if (delta <= 0) {
      throw new BeeArgumentError('New depth has to be greater than the original depth', depth)
    }

    const currentAmount = getAmountForDuration(
      batch.duration,
      chainState.currentPrice,
      this.network === 'gnosis' ? 5 : 15,
    )
    await this.topUpBatch(batch.batchID, currentAmount * (2n ** BigInt(delta) - 1n) + 1n, requestOptions)

    return this.diluteBatch(batch.batchID, depth, requestOptions)
  }

  /**
   * Extends the duration of a postage batch.
   *
   * Use {@link getDurationExtensionCost} to calculate the cost of extending the duration.
   * Use {@link extendStorage} to extend both size and duration.
   *
   * @param postageBatchId
   * @param duration Relative duration to extend the postage batch by.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async extendStorageDuration(
    postageBatchId: BatchId | Uint8Array | string,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
  ) {
    const batch = await this.getPostageBatch(postageBatchId, requestOptions)
    const chainState = await this.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.network === 'gnosis' ? 5 : 15)

    return this.topUpBatch(batch.batchID, amount, requestOptions)
  }

  /**
   * Calculates the cost of extending both the duration and the capacity of a postage batch.
   *
   * The size is ABSOLUTE, while the duration is RELATIVE to the current duration of the postage batch.
   *
   * Use {@link extendStorage} to extend the the duration and capacity of a postage batch.
   *
   * @param postageBatchId
   * @param size Absolute size to extend the postage batch to.
   * @param duration Relative duration to extend the postage batch by.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   * @returns
   */
  async getExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const batch = await this.getPostageBatch(postageBatchId, requestOptions)
    const chainState = await this.getChainState(requestOptions)
    const blockTime = this.network === 'gnosis' ? 5 : 15
    const amount = duration.isZero() ? 0n : getAmountForDuration(duration, chainState.currentPrice, blockTime)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)

    const currentAmount = getAmountForDuration(batch.duration, chainState.currentPrice, blockTime)
    const currentCost = getStampCost(batch.depth, currentAmount)
    const newCost = getStampCost(Math.max(batch.depth, depth), currentAmount + amount)

    return newCost.minus(currentCost)
  }

  /**
   * Calculates the cost of extending the size of a postage batch.
   *
   * The size is ABSOLUTE, so if the postage batch already equals or is greater than the given size,
   * the cost will be zero.
   *
   * Use {@link extendStorageSize} to extend the size of a postage batch.
   *
   * Use {@link getExtensionCost} to get the cost of extending both size and duration.
   * Use {@link getDurationExtensionCost} to get the cost of extending only the duration.
   *
   * @param postageBatchId
   * @param size
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume the future uploaded data is encrypted, which skews the capacity of the postage batch.
   * @param erasureCodeLevel Assume the future uploaded data is erasure coded, which skews the capacity of the postage batch.
   * @returns
   */
  async getSizeExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const batch = await this.getPostageBatch(postageBatchId, requestOptions)
    const chainState = await this.getChainState(requestOptions)
    const depth = getDepthForSize(size, encryption, erasureCodeLevel)
    const delta = depth - batch.depth

    if (delta <= 0) {
      throw new BeeArgumentError('New depth has to be greater than the original depth', depth)
    }

    const currentAmount = getAmountForDuration(
      batch.duration,
      chainState.currentPrice,
      this.network === 'gnosis' ? 5 : 15,
    )
    const currentCost = getStampCost(batch.depth, currentAmount)
    const newCost = getStampCost(depth, currentAmount)

    return newCost.minus(currentCost)
  }

  /**
   * Calculates the cost of extending the duration of a postage batch.
   *
   * The duration is RELATIVE to the current duration of the postage batch,
   * e.g. specifying `Duration.fromDays(30)` will extend the current duration by 30 days,
   * regardless of the current duration.
   *
   * Use {@link extendStorageDuration} to extend the duration of a postage batch.
   *
   * Use {@link getExtensionCost} to get the cost of extending both size and duration.
   * Use {@link getSizeExtensionCost} to get the cost of extending only the size.
   *
   * @param postageBatchId
   * @param duration
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @returns
   */
  async getDurationExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    duration: Duration,
    requestOptions?: BeeRequestOptions,
  ): Promise<BZZ> {
    const batch = await this.getPostageBatch(postageBatchId, requestOptions)
    const chainState = await this.getChainState(requestOptions)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.network === 'gnosis' ? 5 : 15)

    return getStampCost(batch.depth, amount)
  }

  /**
   * Increases the duration of a postage batch by increasing its amount.
   *
   * For a more convenient way to extend the postage batch, refer to the methods below.
   *
   * Use {@link getDurationExtensionCost}, {@link getSizeExtensionCost} or {@link getExtensionCost}
   * to calculate the costs of extending the postage batch properties.
   *
   * Use {@link extendStorageDuration}, {@link extendStorageSize} or {@link extendStorage}
   * to extend the postage batch properties.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive).
   *
   * @param postageBatchId Batch ID
   * @param amount Amount to be added to the batch
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1topup~1{batch_id}~1{amount}/patch)
   */
  async topUpBatch(
    postageBatchId: BatchId | Uint8Array | string,
    amount: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    postageBatchId = new BatchId(postageBatchId)
    const amountString = asNumberString(amount, { min: 1n, name: 'amount' })

    return stamps.topUpBatch(this.getRequestOptionsForCall(requestOptions), postageBatchId, amountString)
  }

  /**
   * Dilutes a postage batch to extend its capacity by increasing its depth.
   *
   * This is a free operation, as for every depth increase, the capacity is doubled,
   * but the amount (duration) is halved.
   *
   * To increase the capacity of the postage batch while retaining the same amount (duration),
   * you need to top up the postage batch first using {@link topUpBatch}.
   *
   * For a more convenient way to extend the postage batch, refer to the methods below.
   *
   * Use {@link getDurationExtensionCost}, {@link getSizeExtensionCost} or {@link getExtensionCost}
   * to calculate the costs of extending the postage batch properties.
   *
   * Use {@link extendStorageDuration}, {@link extendStorageSize} or {@link extendStorage}
   * to extend the postage batch properties.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive).
   *
   * @param postageBatchId Batch ID
   * @param depth Amount to be added to the batch
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1dilute~1%7Bbatch_id%7D~1%7Bdepth%7D/patch)
   */
  async diluteBatch(
    postageBatchId: BatchId | Uint8Array | string,
    depth: number,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    postageBatchId = new BatchId(postageBatchId)
    depth = Types.asNumber(depth, { name: 'depth', min: 18, max: 255 })

    return stamps.diluteBatch(this.getRequestOptionsForCall(requestOptions), postageBatchId, depth)
  }

  /**
   * Returns details for specific postage batch.
   *
   * @param postageBatchId Batch ID
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   * @param encryption Assume that uploads with this postage batch are encrypted, which skews the capacity.
   * @param erasureCodeLevel Assume that uploads with this postage batch are erasure coded, which skews the capacity.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bbatch_id%7D/get)
   */
  async getPostageBatch(
    postageBatchId: BatchId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<PostageBatch> {
    postageBatchId = new BatchId(postageBatchId)

    return stamps.getPostageBatch(
      this.getRequestOptionsForCall(requestOptions),
      postageBatchId,
      encryption,
      erasureCodeLevel,
    )
  }

  /**
   * Return detailed information related to buckets for specific postage batch.
   *
   * @param postageBatchId Batch ID
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}/buckets`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bbatch_id%7D~1buckets/get)
   */
  async getPostageBatchBuckets(
    postageBatchId: BatchId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<PostageBatchBuckets> {
    postageBatchId = new BatchId(postageBatchId)

    return stamps.getPostageBatchBuckets(this.getRequestOptionsForCall(requestOptions), postageBatchId)
  }

  /**
   * Returns all postage batches that belongs to the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps/get)
   * @deprecated Use `getPostageBatches` instead
   */
  async getAllPostageBatch(requestOptions?: BeeRequestOptions): Promise<PostageBatch[]> {
    return stamps.getAllPostageBatches(this.getRequestOptionsForCall(requestOptions)) // TODO: remove in June 2025
  }

  /**
   * Returns all postage batches that are globally available on the Swarm network.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @deprecated Use `getGlobalPostageBatches` instead
   */
  async getAllGlobalPostageBatch(requestOptions?: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
    return stamps.getGlobalPostageBatches(this.getRequestOptionsForCall(requestOptions)) // TODO: remove in June 2025
  }

  /**
   * Returns all postage batches that belong to the node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps/get)
   */
  async getPostageBatches(requestOptions?: BeeRequestOptions): Promise<PostageBatch[]> {
    return stamps.getAllPostageBatches(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Returns all globally available postage batches.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getGlobalPostageBatches(requestOptions?: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
    return stamps.getGlobalPostageBatches(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Fetches the list of all current pending transactions for the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllPendingTransactions(requestOptions?: BeeRequestOptions): Promise<TransactionInfo[]> {
    return transactions.getAllTransactions(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Fetches the transaction information for a specific transaction.
   *
   * @param transactionHash
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPendingTransaction(
    transactionHash: TransactionId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionInfo> {
    transactionHash = new TransactionId(transactionHash)

    return transactions.getTransaction(this.getRequestOptionsForCall(requestOptions), transactionHash)
  }

  /**
   * Rebroadcasts already created transaction.
   *
   * This is mainly needed when the transaction falls off mempool or is not incorporated into any block.
   *
   * @param transactionHash
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async rebroadcastPendingTransaction(
    transactionHash: TransactionId | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    transactionHash = new TransactionId(transactionHash)

    return transactions.rebroadcastTransaction(this.getRequestOptionsForCall(requestOptions), transactionHash)
  }

  /**
   * Cancels a currently pending transaction.
   *
   * @param transactionHash
   * @param gasPrice
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async cancelPendingTransaction(
    transactionHash: TransactionId | Uint8Array | string,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    transactionHash = new TransactionId(transactionHash)

    let gasPriceString

    if (gasPrice) {
      gasPriceString = asNumberString(gasPrice, { min: 0n, name: 'gasPrice' })
    }

    return transactions.cancelTransaction(
      this.getRequestOptionsForCall(requestOptions),
      transactionHash,
      gasPriceString,
    )
  }

  /**
   * Gets the amount of staked BZZ.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getStake(requestOptions?: BeeRequestOptions): Promise<BZZ> {
    return stake.getStake(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the amount of withdrawable staked BZZ.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getWithdrawableStake(requestOptions?: BeeRequestOptions): Promise<BZZ> {
    return stake.getWithdrawableStake(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Withdraws all surplus staked BZZ to the node wallet.
   *
   * Use the {@link getWithdrawableStake} method to check how much surplus stake is available.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async withdrawSurplusStake(requestOptions?: BeeRequestOptions): Promise<TransactionId> {
    return stake.withdrawSurplusStake(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Withdraws all staked BZZ to the node wallet.
   *
   * **Only available when the staking contract is paused and is in the process of being migrated to a new contract!**
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async migrateStake(requestOptions?: BeeRequestOptions): Promise<TransactionId> {
    return stake.migrateStake(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Stakes the given amount of BZZ. Initial deposit must be at least 10 BZZ.
   *
   * Be aware that staked BZZ tokens can **not** be withdrawn.
   *
   * @param amount Amount of BZZ tokens to be staked. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async depositStake(
    amount: BZZ | NumberString | string | bigint,
    options?: TransactionOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    if (options) {
      options = prepareTransactionOptions(options)
    }

    return stake.stake(this.getRequestOptionsForCall(requestOptions), amountString, options)
  }

  /**
   * Gets current status of node in redistribution game.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @see [Bee API reference - `GET /redistributionstate`](https://docs.ethswarm.org/api/#tag/RedistributionState/paths/~1redistributionstate/get)
   */
  async getRedistributionState(requestOptions?: BeeRequestOptions): Promise<RedistributionState> {
    return stake.getRedistributionState(this.getRequestOptionsForCall(requestOptions))
  }

  private async waitForUsablePostageStamp(id: BatchId, timeout = 240_000): Promise<void> {
    const TIME_STEP = 3_000
    for (let time = 0; time < timeout; time += TIME_STEP) {
      try {
        const stamp = await this.getPostageBatch(id)

        if (stamp.usable) {
          return
        }
      } catch (error) {
        // ignore error
      }

      await System.sleepMillis(TIME_STEP)
    }

    throw new BeeError('Timeout on waiting for postage stamp to become usable')
  }

  protected getRequestOptionsForCall(requestOptions?: BeeRequestOptions): BeeRequestOptions {
    if (requestOptions) {
      requestOptions = prepareBeeRequestOptions(requestOptions)
    }

    return requestOptions ? Objects.deepMerge2(this.requestOptions, requestOptions) : this.requestOptions
  }
}
