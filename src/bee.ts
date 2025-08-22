import { Binary, Objects, System, Types } from 'cafe-utility'
import { Readable } from 'stream'
import { Chunk, makeContentAddressedChunk } from './chunk/cac'
import { downloadSingleOwnerChunk, makeSOCAddress, makeSingleOwnerChunk, uploadSingleOwnerChunkData } from './chunk/soc'
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
   * @see [Bee API reference - `HEAD /bytes/{reference}`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1%7Breference%7D/head)
   */
  async probeData(
    reference: Reference | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<ReferenceInformation> {
    reference = new Reference(reference)

    return bytes.head(this.getRequestOptionsForCall(options), reference)
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
   * @param data    Raw chunk to be uploaded
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   *
   * @returns reference is a content hash of the data
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/develop/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `POST /chunks`](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)
   */
  async uploadChunk(
    stamp: EnvelopeWithBatchId | BatchId | Uint8Array | string,
    data: Uint8Array | Chunk,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    data = data instanceof Uint8Array ? data : data.data

    if (options) {
      options = prepareUploadOptions(options)
    }

    if (data.length < Span.LENGTH) {
      throw new BeeArgumentError(`Chunk has to have size of at least ${Span.LENGTH}.`, data)
    }

    if (data.length > CHUNK_SIZE + Span.LENGTH) {
      throw new BeeArgumentError(`Chunk has to have size of at most ${CHUNK_SIZE + Span.LENGTH}.`, data)
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
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
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
   * @param requestOptions - Optional request options.
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
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Optional name of the uploaded file
   * @param options Additional options like tag, encryption, pinning, content-type and request options
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
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   * @see Data
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
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
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

  async hashDirectory(dir: string) {
    return hashDirectory(dir)
  }

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
   * Create a new Tag which is meant for tracking progres of syncing data across network.
   *
   * @param options Options that affects the request behavior
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `POST /tags`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/post)
   */
  async createTag(options?: BeeRequestOptions): Promise<Tag> {
    return tag.createTag(this.getRequestOptionsForCall(options))
  }

  /**
   * Fetches all tags.
   *
   * The listing is limited by options.limit. So you have to iterate using options.offset to get all tags.
   *
   * @param options Options that affects the request behavior
   * @throws TypeError if limit or offset are not numbers or undefined
   * @throws BeeArgumentError if limit or offset have invalid options
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
   * Retrieve tag information from Bee node
   *
   * @param tagUid UID or tag object to be retrieved
   * @param options Options that affects the request behavior
   * @throws TypeError if tagUid is in not correct format
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/get)
   *
   */
  async retrieveTag(tagUid: number | Tag, options?: BeeRequestOptions): Promise<Tag> {
    tagUid = makeTagUid(tagUid)

    return tag.retrieveTag(this.getRequestOptionsForCall(options), tagUid)
  }

  /**
   * Delete Tag
   *
   * @param tagUid UID or tag object to be retrieved
   * @param options Options that affects the request behavior
   * @throws TypeError if tagUid is in not correct format
   * @throws BeeResponse error if something went wrong on the Bee node side while deleting the tag.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `DELETE /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/delete)
   */
  async deleteTag(tagUid: number | Tag, options?: BeeRequestOptions): Promise<void> {
    tagUid = makeTagUid(tagUid)

    return tag.deleteTag(this.getRequestOptionsForCall(options), tagUid)
  }

  /**
   * Update tag's total chunks count.
   *
   * This is important if you are uploading individual chunks with a tag. Then upon finishing the final root chunk,
   * you can use this method to update the total chunks count for the tag.
   *
   * @param tagUid UID or tag object to be retrieved
   * @param reference The root reference that contains all the chunks to be counted
   * @param options Options that affects the request behavior
   * @throws TypeError if tagUid is in not correct format
   * @throws BeeResponse error if something went wrong on the Bee node side while deleting the tag.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/develop/access-the-swarm/syncing)
   * @see [Bee API reference - `PATCH /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/patch)
   */
  async updateTag(tagUid: number | Tag, reference: Reference | string, options?: BeeRequestOptions): Promise<void> {
    reference = new Reference(reference)

    tagUid = makeTagUid(tagUid)

    return tag.updateTag(this.getRequestOptionsForCall(options), tagUid, reference)
  }

  /**
   * Pin local data with given reference
   *
   * @param reference Data reference
   * @param options Options that affects the request behavior
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async pin(reference: Reference | Uint8Array | string, options?: BeeRequestOptions): Promise<void> {
    reference = new Reference(reference)

    return pinning.pin(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Unpin local data with given reference
   *
   * @param reference Data reference
   * @param options Options that affects the request behavior
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async unpin(reference: Reference | Uint8Array | string, options?: BeeRequestOptions): Promise<void> {
    reference = new Reference(reference)

    return pinning.unpin(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Get list of all locally pinned references
   *
   * @param options Options that affects the request behavior
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async getAllPins(options?: BeeRequestOptions): Promise<Reference[]> {
    return pinning.getAllPins(this.getRequestOptionsForCall(options))
  }

  /**
   * Get pinning status of chunk with given reference
   *
   * @param reference Bee data reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/develop/access-the-swarm/pinning)
   */
  async getPin(reference: Reference | Uint8Array | string, options?: BeeRequestOptions): Promise<Pin> {
    reference = new Reference(reference)

    return pinning.getPin(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Instructs the Bee node to reupload a locally pinned data into the network.
   *
   * @param reference Bee data reference to be re-uploaded in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @throws BeeArgumentError if the reference is not locally pinned
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   *
   * @see [Bee API reference - `PUT /stewardship`](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1{reference}/put)
   */
  async reuploadPinnedData(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<void> {
    postageBatchId = new BatchId(postageBatchId)
    reference = new Reference(reference)

    await stewardship.reupload(this.getRequestOptionsForCall(options), postageBatchId, reference)
  }

  /**
   * Checks if content specified by reference is retrievable from the network.
   *
   * @param reference Bee data reference to be checked in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   *
   * @see [Bee API reference - `GET /stewardship`](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1{reference}/get)
   */
  async isReferenceRetrievable(
    reference: Reference | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<boolean> {
    reference = new Reference(reference)

    return stewardship.isRetrievable(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Functions that validates if feed is retrievable in the network.
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
   * **Warning! If the recipient Bee node is a light node, then he will never receive the message!**
   * This is because light nodes does not fully participate in the data exchange in Swarm network and hence the message won't arrive to them.
   *
   * @param postageBatchId Postage BatchId that will be assigned to sent message
   * @param topic Topic name
   * @param target Target message address prefix. Has a limit on length. Recommend to use `Utils.Pss.makeMaxTarget()` to get the most specific target that Bee node will accept.
   * @param data Message to be sent
   * @param recipient Recipient public key
   * @param options Options that affects the request behavior
   * @throws TypeError if `data`, `batchId`, `target` or `recipient` are in invalid format
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
    options?: BeeRequestOptions,
  ): Promise<void> {
    postageBatchId = new BatchId(postageBatchId)
    assertData(data)

    if (recipient) {
      recipient = new PublicKey(recipient)

      return pss.send(this.getRequestOptionsForCall(options), topic, target, data, postageBatchId, recipient)
    } else {
      return pss.send(this.getRequestOptionsForCall(options), topic, target, data, postageBatchId)
    }
  }

  /**
   * Subscribe to messages for given topic with Postal Service for Swarm
   *
   * **Warning! If connected Bee node is a light node, then he will never receive any message!**
   * This is because light nodes does not fully participate in the data exchange in Swarm network and hence the message won't arrive to them.
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
   * Receive message with Postal Service for Swarm
   *
   * Because sending a PSS message is slow and CPU intensive,
   * it is not supposed to be used for general messaging but
   * most likely for setting up an encrypted communication
   * channel by sending an one-off message.
   *
   * This is a helper function to wait for exactly one message to
   * arrive and then cancel the subscription. Additionally a
   * timeout can be provided for the message to arrive or else
   * an error will be thrown.
   *
   * **Warning! If connected Bee node is a light node, then he will never receive any message!**
   * This is because light nodes does not fully participate in the data exchange in Swarm network and hence the message won't arrive to them.
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
    const soc = makeSingleOwnerChunk(cac, identifier, signer)

    return gsoc.send(this.getRequestOptionsForCall(requestOptions), soc, postageBatchId, options)
  }

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
   * Create feed manifest chunk and return the reference to it.
   *
   * Feed manifest chunk allows for a feed to be able to be resolved through `/bzz` endpoint.
   *
   * @param postageBatchId  Postage BatchId to be used to create the Feed Manifest
   * @param topic           Topic in hex or bytes
   * @param owner           Owner's ethereum address in hex or bytes
   * @param options Options that affects the request behavior
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
   * Make a new feed reader for downloading feed updates.
   *
   * @param topic   Topic in hex or bytes
   * @param owner   Owner's ethereum address in hex or bytes
   * @param options Options that affects the request behavior
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/develop/tools-and-features/feeds)
   */
  makeFeedReader(
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    options?: BeeRequestOptions,
  ): FeedReader {
    topic = new Topic(topic)
    owner = new EthAddress(owner)

    return makeFeedReader(this.getRequestOptionsForCall(options), topic, owner)
  }

  /**
   * Make a new feed writer for updating feeds
   *
   * @param topic   Topic in hex or bytes
   * @param signer  The signer's private key or a Signer instance that can sign data
   * @param options Options that affects the request behavior
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/develop/tools-and-features/feeds)
   */
  makeFeedWriter(
    topic: Topic | Uint8Array | string,
    signer?: PrivateKey | Uint8Array | string,
    options?: BeeRequestOptions,
  ): FeedWriter {
    topic = new Topic(topic)
    signer = signer ? new PrivateKey(signer) : this.signer

    if (!signer) {
      throw Error('No signer provided')
    }

    return makeFeedWriter(this.getRequestOptionsForCall(options), topic, signer)
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
   * Returns an object for reading single owner chunks
   *
   * @param ownerAddress The ethereum address of the owner
   * @param options Options that affects the request behavior
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/develop/tools-and-features/chunk-types#single-owner-chunks)
   */
  makeSOCReader(ownerAddress: EthAddress | Uint8Array | string, options?: BeeRequestOptions): SOCReader {
    ownerAddress = new EthAddress(ownerAddress)

    return {
      owner: ownerAddress,
      download: downloadSingleOwnerChunk.bind(null, this.getRequestOptionsForCall(options), ownerAddress),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks
   *
   * @param signer The signer's private key or a Signer instance that can sign data
   * @param options Options that affects the request behavior
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/develop/tools-and-features/chunk-types#single-owner-chunks)
   */
  makeSOCWriter(signer?: PrivateKey | Uint8Array | string, options?: BeeRequestOptions): SOCWriter {
    signer = signer ? new PrivateKey(signer) : this.signer

    if (!signer) {
      throw Error('No signer provided')
    }

    return {
      ...this.makeSOCReader((signer as PrivateKey).publicKey().address(), options),
      upload: uploadSingleOwnerChunkData.bind(null, this.getRequestOptionsForCall(options), signer),
    }
  }

  async createEnvelope(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<EnvelopeWithBatchId> {
    postageBatchId = new BatchId(postageBatchId)
    reference = new Reference(reference)

    return postEnvelope(this.getRequestOptionsForCall(options), postageBatchId, reference)
  }

  /**
   * Get reserve commitment hash duration seconds
   */
  async rchash(depth: number, anchor1: string, anchor2: string, options?: BeeRequestOptions): Promise<number> {
    return rchash(this.getRequestOptionsForCall(options), depth, anchor1, anchor2)
  }

  /**
   * Ping the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param options Options that affects the request behavior
   * @throws If connection was not successful throw error
   */
  async checkConnection(options?: BeeRequestOptions): Promise<void> | never {
    return status.checkConnection(this.getRequestOptionsForCall(options))
  }

  /**
   * Ping the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param options Options that affects the request behavior
   * @returns true if successful, false on error
   */
  async isConnected(options?: BeeRequestOptions): Promise<boolean> {
    try {
      await status.checkConnection(this.getRequestOptionsForCall(options))
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
   * @param options
   */
  async isGateway(options?: BeeRequestOptions): Promise<boolean> {
    return status.isGateway(this.getRequestOptionsForCall(options))
  }

  // Legacy debug API

  async getNodeAddresses(options?: BeeRequestOptions): Promise<NodeAddresses> {
    return connectivity.getNodeAddresses(this.getRequestOptionsForCall(options))
  }

  async getBlocklist(options?: BeeRequestOptions): Promise<Peer[]> {
    return connectivity.getBlocklist(this.getRequestOptionsForCall(options))
  }

  /**
   * Get list of peers for this node
   */
  async getPeers(options?: BeeRequestOptions): Promise<Peer[]> {
    return connectivity.getPeers(this.getRequestOptionsForCall(options))
  }

  async removePeer(peer: PeerAddress | string, options?: BeeRequestOptions): Promise<RemovePeerResponse> {
    peer = new PeerAddress(peer)

    return connectivity.removePeer(this.getRequestOptionsForCall(options), peer)
  }

  async getTopology(options?: BeeRequestOptions): Promise<Topology> {
    return connectivity.getTopology(this.getRequestOptionsForCall(options))
  }

  async pingPeer(peer: PeerAddress | string, options?: BeeRequestOptions): Promise<PingResponse> {
    peer = new PeerAddress(peer)

    return connectivity.pingPeer(this.getRequestOptionsForCall(options), peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  async getAllBalances(options?: BeeRequestOptions): Promise<BalanceResponse> {
    return balance.getAllBalances(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Swarm address of peer
   */
  async getPeerBalance(address: PeerAddress | string, options?: BeeRequestOptions): Promise<PeerBalance> {
    address = new PeerAddress(address)

    return balance.getPeerBalance(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  async getPastDueConsumptionBalances(options?: BeeRequestOptions): Promise<BalanceResponse> {
    return balance.getPastDueConsumptionBalances(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Swarm address of peer
   */
  async getPastDueConsumptionPeerBalance(
    address: PeerAddress | string,
    options?: BeeRequestOptions,
  ): Promise<PeerBalance> {
    address = new PeerAddress(address)

    return balance.getPastDueConsumptionPeerBalance(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get the address of the chequebook contract used.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChequebookAddress(requestOptions?: BeeRequestOptions): Promise<ChequebookAddressResponse> {
    return chequebook.getChequebookAddress(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get the balance of the chequebook
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getChequebookBalance(requestOptions?: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
    return chequebook.getChequebookBalance(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get last cheques for all peers.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getLastCheques(requestOptions?: BeeRequestOptions): Promise<LastChequesResponse> {
    return chequebook.getLastCheques(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get last cheques for the peer.
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
   * Get last cashout action for the peer.
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
   * Cashout the last cheque for the peer
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
   * Deposit tokens from node wallet into chequebook.
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   * @deprecated Use `depositBZZToChequebook` instead.
   */
  async depositTokens(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    options?: BeeRequestOptions,
  ): Promise<TransactionId> {
    return this.depositBZZToChequebook(amount, gasPrice, options)
  }

  /**
   * Deposit tokens from node wallet into chequebook
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async depositBZZToChequebook(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    options?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    let gasPriceString

    if (gasPrice) {
      gasPriceString = asNumberString(amount, { min: 0n, name: 'gasPrice' })
    }

    return chequebook.depositTokens(this.getRequestOptionsForCall(options), amountString, gasPriceString)
  }

  /**
   * Withdraw tokens from the chequebook to the node wallet
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   * @deprecated Use `withdrawBZZFromChequebook` instead.
   */
  async withdrawTokens(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    options?: BeeRequestOptions,
  ): Promise<TransactionId> {
    return this.withdrawBZZFromChequebook(amount, gasPrice, options)
  }

  /**
   * Withdraw tokens from the chequebook to the node wallet.
   *
   * @param amount Amount of BZZ tokens to withdraw. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return Transaction ID
   */
  async withdrawBZZFromChequebook(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    options?: BeeRequestOptions,
  ): Promise<TransactionId> {
    // TODO: check BZZ in tests
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    let gasPriceString

    if (gasPrice) {
      gasPriceString = asNumberString(amount, { min: 0n, name: 'gasPrice' })
    }

    return chequebook.withdrawTokens(this.getRequestOptionsForCall(options), amountString, gasPriceString)
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
   * Get amount of sent and received from settlements with a peer
   *
   * @param address  Swarm address of peer
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getSettlements(address: PeerAddress | string, requestOptions?: BeeRequestOptions): Promise<Settlements> {
    address = new PeerAddress(address)

    return settlements.getSettlements(this.getRequestOptionsForCall(requestOptions), address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllSettlements(requestOptions?: BeeRequestOptions): Promise<AllSettlements> {
    return settlements.getAllSettlements(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get status of node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getStatus(requestOptions?: BeeRequestOptions): Promise<DebugStatus> {
    return debugStatus.getDebugStatus(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get health of node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getHealth(requestOptions?: BeeRequestOptions): Promise<Health> {
    return debugStatus.getHealth(this.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Get readiness of node.
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
    const newCost = getStampCost(depth, currentAmount + amount)

    return newCost.minus(currentCost)
  }

  async getSizeExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    size: Size,
    options?: BeeRequestOptions,
    encryption?: boolean,
    erasureCodeLevel?: RedundancyLevel,
  ): Promise<BZZ> {
    const batch = await this.getPostageBatch(postageBatchId, options)
    const chainState = await this.getChainState(options)
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

  async getDurationExtensionCost(
    postageBatchId: BatchId | Uint8Array | string,
    duration: Duration,
    options?: BeeRequestOptions,
  ): Promise<BZZ> {
    const batch = await this.getPostageBatch(postageBatchId, options)
    const chainState = await this.getChainState(options)
    const amount = getAmountForDuration(duration, chainState.currentPrice, this.network === 'gnosis' ? 5 : 15)

    return getStampCost(batch.depth, amount)
  }

  /**
   * Topup a fresh amount of BZZ to given Postage Batch.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive).
   *
   * @param postageBatchId Batch ID
   * @param amount Amount to be added to the batch
   * @param options Request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1topup~1{batch_id}~1{amount}/patch)
   */
  async topUpBatch(
    postageBatchId: BatchId | Uint8Array | string,
    amount: NumberString | string | bigint,
    options?: BeeRequestOptions,
  ): Promise<BatchId> {
    postageBatchId = new BatchId(postageBatchId)
    const amountString = asNumberString(amount, { min: 1n, name: 'amount' })

    return stamps.topUpBatch(this.getRequestOptionsForCall(options), postageBatchId, amountString)
  }

  /**
   * Dilute given Postage Batch with new depth (that has to be bigger then the original depth), which allows
   * the Postage Batch to be used for more chunks.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive).
   *
   * @param postageBatchId Batch ID
   * @param depth Amount to be added to the batch
   * @param options Request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1dilute~1%7Bbatch_id%7D~1%7Bdepth%7D/patch)
   */
  async diluteBatch(
    postageBatchId: BatchId | Uint8Array | string,
    depth: number,
    options?: BeeRequestOptions,
  ): Promise<BatchId> {
    postageBatchId = new BatchId(postageBatchId)
    depth = Types.asNumber(depth, { name: 'depth', min: 18, max: 255 })

    return stamps.diluteBatch(this.getRequestOptionsForCall(options), postageBatchId, depth)
  }

  /**
   * Return details for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bbatch_id%7D/get)
   */
  async getPostageBatch(
    postageBatchId: BatchId | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<PostageBatch> {
    postageBatchId = new BatchId(postageBatchId)

    return stamps.getPostageBatch(this.getRequestOptionsForCall(options), postageBatchId)
  }

  /**
   * Return detailed information related to buckets for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}/buckets`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bbatch_id%7D~1buckets/get)
   */
  async getPostageBatchBuckets(
    postageBatchId: BatchId | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<PostageBatchBuckets> {
    postageBatchId = new BatchId(postageBatchId)

    return stamps.getPostageBatchBuckets(this.getRequestOptionsForCall(options), postageBatchId)
  }

  /**
   * Return all postage batches that has the node available.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps/get)
   * @deprecated Use `getPostageBatches` instead
   */
  async getAllPostageBatch(options?: BeeRequestOptions): Promise<PostageBatch[]> {
    return stamps.getAllPostageBatches(this.getRequestOptionsForCall(options)) // TODO: remove in June 2025
  }

  /**
   * Return all globally available postage batches.
   * @deprecated Use `getGlobalPostageBatches` instead
   */
  async getAllGlobalPostageBatch(options?: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
    return stamps.getGlobalPostageBatches(this.getRequestOptionsForCall(options)) // TODO: remove in June 2025
  }

  /**
   * Return all postage batches that belong to the node.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/develop/access-the-swarm/introduction/#keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps/get)
   */
  async getPostageBatches(options?: BeeRequestOptions): Promise<PostageBatch[]> {
    return stamps.getAllPostageBatches(this.getRequestOptionsForCall(options))
  }

  /**
   * Return all globally available postage batches.
   */
  async getGlobalPostageBatches(options?: BeeRequestOptions): Promise<GlobalPostageBatch[]> {
    return stamps.getGlobalPostageBatches(this.getRequestOptionsForCall(options))
  }

  /**
   * Fetch the list of all current pending transactions for the Bee node.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAllPendingTransactions(options?: BeeRequestOptions): Promise<TransactionInfo[]> {
    return transactions.getAllTransactions(this.getRequestOptionsForCall(options))
  }

  /**
   * Fetch the transaction information for a specific transaction.
   * @param transactionHash
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getPendingTransaction(
    transactionHash: TransactionId | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<TransactionInfo> {
    transactionHash = new TransactionId(transactionHash)

    return transactions.getTransaction(this.getRequestOptionsForCall(options), transactionHash)
  }

  /**
   * Rebroadcast already created transaction.
   *
   * This is mainly needed when the transaction falls off mempool or is not incorporated into any block.
   *
   * @param transactionHash
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async rebroadcastPendingTransaction(
    transactionHash: TransactionId | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<TransactionId> {
    transactionHash = new TransactionId(transactionHash)

    return transactions.rebroadcastTransaction(this.getRequestOptionsForCall(options), transactionHash)
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
    options?: BeeRequestOptions,
  ): Promise<TransactionId> {
    transactionHash = new TransactionId(transactionHash)

    let gasPriceString

    if (gasPrice) {
      gasPriceString = asNumberString(gasPrice, { min: 0n, name: 'gasPrice' })
    }

    return transactions.cancelTransaction(this.getRequestOptionsForCall(options), transactionHash, gasPriceString)
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
  async withdrawSurplusStake(options?: BeeRequestOptions): Promise<TransactionId> {
    return stake.withdrawSurplusStake(this.getRequestOptionsForCall(options))
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

  protected getRequestOptionsForCall(options?: BeeRequestOptions): BeeRequestOptions {
    if (options) {
      options = prepareBeeRequestOptions(options)
    }

    return options ? Objects.deepMerge2(this.requestOptions, options) : this.requestOptions
  }
}
