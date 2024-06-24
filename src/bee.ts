import { ReferenceType } from '@ethersphere/swarm-cid'
import { Objects, System } from 'cafe-utility'
import { Readable } from 'stream'
import { makeSigner } from './chunk/signer'
import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData } from './chunk/soc'
import { Index, IndexBytes, makeFeedReader, makeFeedWriter } from './feed'
import { getJsonData, setJsonData } from './feed/json'
import { areAllSequentialFeedsUpdateRetrievable } from './feed/retrievable'
import { makeTopic, makeTopicFromString } from './feed/topic'
import { DEFAULT_FEED_TYPE, FeedType, assertFeedType } from './feed/type'
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
import * as debugTag from './modules/debug/tag'
import * as transactions from './modules/debug/transactions'
import { createFeedManifest } from './modules/feed'
import * as pinning from './modules/pinning'
import * as pss from './modules/pss'
import * as status from './modules/status'
import * as stewardship from './modules/stewardship'
import * as tag from './modules/tag'
import type {
  Address,
  AddressPrefix,
  AllSettlements,
  AnyJson,
  BalanceResponse,
  BatchId,
  BeeOptions,
  BeeRequestOptions,
  BeeVersions,
  ChainState,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  CollectionUploadOptions,
  Data,
  DebugStatus,
  ExtendedTag,
  FeedReader,
  FeedWriter,
  FileData,
  FileUploadOptions,
  Health,
  JsonFeedOptions,
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
  PublicKey,
  RedistributionState,
  Reference,
  RemovePeerResponse,
  ReserveState,
  SOCReader,
  SOCWriter,
  Settlements,
  Signer,
  Tag,
  Topic,
  Topology,
  TransactionHash,
  TransactionInfo,
  UploadOptions,
  UploadRedundancyOptions,
  UploadResultWithCid,
  GranteesResult,
  GetGranteesResult,
  WalletBalance,
} from './types'
import {
  AllTagsOptions,
  CHUNK_SIZE,
  CashoutOptions,
  Collection,
  FeedManifestResult,
  PostageBatchOptions,
  ReferenceCidOrEns,
  ReferenceOrEns,
  SPAN_SIZE,
  STAMPS_AMOUNT_MIN,
  STAMPS_DEPTH_MAX,
  STAMPS_DEPTH_MIN,
  TransactionOptions,
  UploadResult,
} from './types'
import { wrapBytesWithHelpers } from './utils/bytes'
import { assertCollection, makeCollectionFromFileList } from './utils/collection'
import { makeCollectionFromFS } from './utils/collection.node'
import { prepareWebsocketData } from './utils/data'
import { BeeArgumentError, BeeError } from './utils/error'
import { EthAddress, makeEthAddress, makeHexEthAddress } from './utils/eth'
import { fileArrayBuffer, isFile } from './utils/file'
import {
  addCidConversionFunction,
  assertAddress,
  assertAddressPrefix,
  assertAllTagsOptions,
  assertBatchId,
  assertCashoutOptions,
  assertCollectionUploadOptions,
  assertData,
  assertFileData,
  assertFileUploadOptions,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertPostageBatchOptions,
  assertPssMessageHandler,
  assertPublicKey,
  assertReference,
  assertReferenceOrEns,
  assertRequestOptions,
  assertTransactionHash,
  assertTransactionOptions,
  assertUploadOptions,
  isReadable,
  isTag,
  makeReferenceOrEns,
  makeTagUid,
} from './utils/type'
import { assertBeeUrl, stripLastSlash } from './utils/url'

/**
 * The main component that abstracts operations available on the main Bee API.
 *
 * Not all methods are always available as it depends in what mode is Bee node launched in.
 * For example gateway mode and light node mode has only limited set of endpoints enabled.
 */
export class Bee {
  /**
   * URL on which is the main API of Bee node exposed
   */
  public readonly url: string

  /**
   * Default Signer object used for signing operations, mainly Feeds.
   */
  public readonly signer?: Signer

  /**
   * Options for making requests
   * @private
   */
  private readonly requestOptions: BeeRequestOptions

  /**
   * @param url URL on which is the main API of Bee node exposed
   * @param options
   */
  constructor(url: string, options?: BeeOptions) {
    assertBeeUrl(url)

    // Remove last slash if present, as our endpoint strings starts with `/...`
    // which could lead to double slash in URL to which Bee responds with
    // unnecessary redirects.
    this.url = stripLastSlash(url)

    if (options?.signer) {
      this.signer = makeSigner(options.signer)
    }

    this.requestOptions = {
      baseURL: this.url,
      timeout: options?.timeout ?? false,
      headers: options?.headers,
      onRequest: options?.onRequest,
    }
  }

  /**
   * Upload data to a Bee node
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data to be uploaded
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   *
   * @returns reference is a content hash of the data
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `POST /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes/post)
   */
  async uploadData(
    postageBatchId: string | BatchId,
    data: string | Uint8Array,
    options?: UploadOptions & UploadRedundancyOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    assertBatchId(postageBatchId)
    assertData(data)

    if (options) assertUploadOptions(options)

    return bytes.upload(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options)
  }

  /**
   * Download data as a byte array
   *
   * @param reference Bee data reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)
   */
  async downloadData(reference: ReferenceOrEns | string, options?: BeeRequestOptions): Promise<Data> {
    assertRequestOptions(options)
    assertReferenceOrEns(reference)

    return bytes.download(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Download data as a Readable stream
   *
   * @param reference Bee data reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)
   */
  async downloadReadableData(
    reference: ReferenceOrEns | string,
    options?: BeeRequestOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    assertRequestOptions(options)
    assertReferenceOrEns(reference)

    return bytes.downloadReadable(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Upload chunk to a Bee node
   *
   * @param postageBatchId Postage BatchId to be used to upload the chunk with
   * @param data    Raw chunk to be uploaded
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   *
   * @returns reference is a content hash of the data
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `POST /chunks`](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)
   */
  async uploadChunk(
    postageBatchId: string | BatchId,
    data: Uint8Array,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Reference> {
    assertBatchId(postageBatchId)

    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Data has to be Uint8Array instance!')
    }

    if (data.length < SPAN_SIZE) {
      throw new BeeArgumentError(`Chunk has to have size of at least ${SPAN_SIZE}.`, data)
    }

    if (data.length > CHUNK_SIZE + SPAN_SIZE) {
      throw new BeeArgumentError(`Chunk has to have size of at most ${CHUNK_SIZE}.`, data)
    }

    if (options) assertUploadOptions(options)

    return chunk.upload(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options)
  }

  /**
   * Download chunk as a byte array
   *
   * @param reference Bee chunk reference in hex string (either 64 or 128 chars long) or ENS domain.
   * @param options Options that affects the request behavior
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /chunks`](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks~1{reference}/get)
   */
  async downloadChunk(reference: ReferenceOrEns | string, options?: BeeRequestOptions): Promise<Data> {
    assertRequestOptions(options)
    assertReferenceOrEns(reference)

    return chunk.download(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Adds grantees to a postage batch.
   *
   * @param postageBatchId - The ID of the postage batch.
   * @param grantees - An array of public keys representing the grantees.
   * @param requestOptions - Optional request options.
   * @returns A promise that resolves to a `GranteesResult` object.
   */
  async addGrantees(
    postageBatchId: string | BatchId,
    grantees: string[],
    requestOptions?: BeeRequestOptions,
  ): Promise<GranteesResult> {
    assertBatchId(postageBatchId)

    return bzz.addGrantees(this.getRequestOptionsForCall(requestOptions), postageBatchId, grantees)
  }

  /**
   * Retrieves the grantees for a given reference or ENS name.
   *
   * @param reference - The reference.
   * @param requestOptions - Optional request options.
   * @returns A promise that resolves to a `GetGranteesResult object.
   */
  async getGrantees(
    reference: ReferenceOrEns | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<GetGranteesResult> {
    return bzz.getGrantees(reference, this.getRequestOptionsForCall(requestOptions))
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
    reference: Reference | string,
    histrory: Reference | string,
    postageBatchId: string | BatchId,
    grantees: string,
    requestOptions?: BeeRequestOptions,
  ): Promise<GranteesResult> {
    assertBatchId(postageBatchId)

    return bzz.patchGrantees(
      reference,
      histrory,
      postageBatchId,
      grantees,
      this.getRequestOptionsForCall(requestOptions),
    )
  }

  /**
   * Upload single file to a Bee node.
   *
   * **To make sure that you won't loose critical data it is highly recommended to also
   * locally pin the data with `options.pin = true`**
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Optional name of the uploaded file
   * @param options Additional options like tag, encryption, pinning, content-type and request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/File/paths/~1bzz/post)
   * @returns reference is a content hash of the file
   */
  async uploadFile(
    postageBatchId: string | BatchId,
    data: string | Uint8Array | Readable | File,
    name?: string,
    options?: FileUploadOptions & UploadRedundancyOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResultWithCid> {
    assertBatchId(postageBatchId)
    assertFileData(data)

    if (options) assertFileUploadOptions(options)

    if (name && typeof name !== 'string') {
      throw new TypeError('name has to be string or undefined!')
    }

    if (isFile(data)) {
      const fileData = await fileArrayBuffer(data)
      const fileName = name ?? data.name
      const contentType = data.type
      const fileOptions = { contentType, ...options }

      return addCidConversionFunction(
        await bzz.uploadFile(
          this.getRequestOptionsForCall(requestOptions),
          fileData,
          postageBatchId,
          fileName,
          fileOptions,
        ),
        ReferenceType.MANIFEST,
      )
    } else if (isReadable(data) && options?.tag && !options.size) {
      // TODO: Needed until https://github.com/ethersphere/bee/issues/2317 is resolved
      const result = await bzz.uploadFile(
        this.getRequestOptionsForCall(requestOptions),
        data,
        postageBatchId,
        name,
        options,
      )
      await this.updateTag(options.tag, result.reference)

      return addCidConversionFunction(result, ReferenceType.MANIFEST)
    } else {
      return addCidConversionFunction(
        await bzz.uploadFile(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, name, options),
        ReferenceType.MANIFEST,
      )
    }
  }

  /**
   * Download single file.
   *
   * @param reference Bee file reference in hex string (either 64 or 128 chars long), ENS domain or Swarm CID.
   * @param path If reference points to manifest, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   * @throws TypeError if some of the input parameters is not expected type
   * @throws BeeArgumentError if there is passed ENS domain with invalid unicode characters
   * @see Data
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz~1{reference}~1{path}/get)
   */
  async downloadFile(
    reference: ReferenceCidOrEns | string,
    path = '',
    options?: BeeRequestOptions,
  ): Promise<FileData<Data>> {
    assertRequestOptions(options)
    reference = makeReferenceOrEns(reference, ReferenceType.MANIFEST)

    return bzz.downloadFile(this.getRequestOptionsForCall(options), reference, path)
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
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz~1{reference}~1{path}/get)
   */
  async downloadReadableFile(
    reference: ReferenceCidOrEns | string,
    path = '',
    options?: BeeRequestOptions,
  ): Promise<FileData<ReadableStream<Uint8Array>>> {
    assertRequestOptions(options)
    reference = makeReferenceOrEns(reference, ReferenceType.MANIFEST)

    return bzz.downloadFileReadable(this.getRequestOptionsForCall(options), reference, path)
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
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee docs - Upload directory](https://docs.ethswarm.org/docs/access-the-swarm/upload-a-directory/)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz/post)
   */
  async uploadFiles(
    postageBatchId: string | BatchId,
    fileList: FileList | File[],
    options?: CollectionUploadOptions & UploadRedundancyOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResultWithCid> {
    assertBatchId(postageBatchId)

    if (options) assertCollectionUploadOptions(options)

    const data = await makeCollectionFromFileList(fileList)

    return addCidConversionFunction(
      await bzz.uploadCollection(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options),
      ReferenceType.MANIFEST,
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
    postageBatchId: string | BatchId,
    collection: Collection,
    options?: CollectionUploadOptions & UploadRedundancyOptions,
  ): Promise<UploadResultWithCid> {
    assertBatchId(postageBatchId)
    assertCollection(collection)

    if (options) assertCollectionUploadOptions(options)

    return addCidConversionFunction(
      await bzz.uploadCollection(this.requestOptions, collection, postageBatchId, options),
      ReferenceType.MANIFEST,
    )
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
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee docs - Upload directory](https://docs.ethswarm.org/docs/access-the-swarm/upload-a-directory/)
   * @see [Bee API reference - `POST /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz/post)
   */
  async uploadFilesFromDirectory(
    postageBatchId: string | BatchId,
    dir: string,
    options?: CollectionUploadOptions & UploadRedundancyOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResultWithCid> {
    assertBatchId(postageBatchId)

    if (options) assertCollectionUploadOptions(options)
    const data = await makeCollectionFromFS(dir)

    return addCidConversionFunction(
      await bzz.uploadCollection(this.getRequestOptionsForCall(requestOptions), data, postageBatchId, options),
      ReferenceType.MANIFEST,
    )
  }

  /**
   * Create a new Tag which is meant for tracking progres of syncing data across network.
   *
   * @param options Options that affects the request behavior
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `POST /tags`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/post)
   */
  async createTag(options?: BeeRequestOptions): Promise<Tag> {
    assertRequestOptions(options)

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
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/get)
   */
  async getAllTags(options?: AllTagsOptions): Promise<Tag[]> {
    assertRequestOptions(options)
    assertAllTagsOptions(options)

    return tag.getAllTags(this.getRequestOptionsForCall(options), options?.offset, options?.limit)
  }

  /**
   * Retrieve tag information from Bee node
   *
   * @param tagUid UID or tag object to be retrieved
   * @param options Options that affects the request behavior
   * @throws TypeError if tagUid is in not correct format
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/get)
   *
   */
  async retrieveTag(tagUid: number | Tag, options?: BeeRequestOptions): Promise<Tag> {
    assertRequestOptions(options)

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
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `DELETE /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/delete)
   */
  async deleteTag(tagUid: number | Tag, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)

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
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `PATCH /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/patch)
   */
  async updateTag(tagUid: number | Tag, reference: Reference | string, options?: BeeRequestOptions): Promise<void> {
    assertReference(reference)
    assertRequestOptions(options)

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
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async pin(reference: Reference | string, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertReference(reference)

    return pinning.pin(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Unpin local data with given reference
   *
   * @param reference Data reference
   * @param options Options that affects the request behavior
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async unpin(reference: Reference | string, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertReference(reference)

    return pinning.unpin(this.getRequestOptionsForCall(options), reference)
  }

  /**
   * Get list of all locally pinned references
   *
   * @param options Options that affects the request behavior
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async getAllPins(options?: BeeRequestOptions): Promise<Reference[]> {
    assertRequestOptions(options)

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
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async getPin(reference: Reference | string, options?: BeeRequestOptions): Promise<Pin> {
    assertRequestOptions(options)
    assertReference(reference)

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
  async reuploadPinnedData(reference: ReferenceOrEns | string, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertReferenceOrEns(reference)

    await stewardship.reupload(this.getRequestOptionsForCall(options), reference)
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
  async isReferenceRetrievable(reference: ReferenceOrEns | string, options?: BeeRequestOptions): Promise<boolean> {
    assertRequestOptions(options)
    assertReferenceOrEns(reference)

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
    type: FeedType,
    owner: EthAddress | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    index?: Index | number | IndexBytes | string,
    options?: BeeRequestOptions,
  ): Promise<boolean> {
    const canonicalOwner = makeEthAddress(owner)
    const canonicalTopic = makeTopic(topic)

    if (!index) {
      try {
        await this.makeFeedReader(type, canonicalTopic, canonicalOwner).download()

        return true
      } catch (e: any) {
        if (e?.response?.status === 404) {
          return false
        }

        throw e
      }
    }

    if (type !== 'sequence') {
      throw new BeeError('Only Sequence type of Feeds is supported at the moment')
    }

    return areAllSequentialFeedsUpdateRetrievable(
      this,
      canonicalOwner,
      canonicalTopic,
      index,
      this.getRequestOptionsForCall(options),
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
   * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/dapps-on-swarm/pss)
   * @see [Bee API reference - `POST /pss`](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1send~1{topic}~1{targets}/post)
   */
  async pssSend(
    postageBatchId: string | BatchId,
    topic: string,
    target: AddressPrefix,
    data: string | Uint8Array,
    recipient?: string | PublicKey,
    options?: BeeRequestOptions,
  ): Promise<void> {
    assertRequestOptions(options)
    assertData(data)
    assertBatchId(postageBatchId)
    assertAddressPrefix(target)

    if (typeof topic !== 'string') {
      throw new TypeError('topic has to be an string!')
    }

    if (recipient) {
      assertPublicKey(recipient)

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
   * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/dapps-on-swarm/pss)
   * @see [Bee API reference - `GET /pss`](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1subscribe~1{topic}/get)
   */
  pssSubscribe(topic: string, handler: PssMessageHandler): PssSubscription {
    assertPssMessageHandler(handler)

    if (typeof topic !== 'string') {
      throw new TypeError('topic has to be an string!')
    }

    const ws = pss.subscribe(this.url, topic)

    let cancelled = false
    const cancel = () => {
      if (cancelled === false) {
        cancelled = true

        // although the WebSocket API offers a `close` function, it seems that
        // with the library that we are using (isomorphic-ws) it doesn't close
        // the websocket properly, whereas `terminate` does
        if (ws.terminate) ws.terminate()
        else ws.close() // standard Websocket in browser does not have terminate function
      }
    }

    const subscription = {
      topic,
      cancel,
    }

    ws.onmessage = async ev => {
      const data = await prepareWebsocketData(ev.data)

      // ignore empty messages
      if (data.length > 0) {
        handler.onMessage(wrapBytesWithHelpers(data), subscription)
      }
    }
    ws.onerror = ev => {
      // ignore errors after subscription was cancelled
      if (!cancelled) {
        handler.onError(new BeeError(ev.message), subscription)
      }
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
   * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/dapps-on-swarm/pss)
   * @see [Bee API reference - `GET /pss`](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1subscribe~1{topic}/get)
   */
  async pssReceive(topic: string, timeoutMsec = 0): Promise<Data> {
    if (typeof topic !== 'string') {
      throw new TypeError('topic has to be an string!')
    }

    if (typeof timeoutMsec !== 'number') {
      throw new TypeError('timeoutMsc parameter has to be a number!')
    }

    return new Promise((resolve, reject) => {
      let timeout: number | undefined
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
      })

      if (timeoutMsec > 0) {
        // we need to cast the type because Typescript is getting confused with Node.js'
        // alternative type definitions
        timeout = setTimeout(() => {
          subscription.cancel()
          reject(new BeeError('pssReceive timeout'))
        }, timeoutMsec) as unknown as number
      }
    })
  }

  /**
   * Create feed manifest chunk and return the reference to it.
   *
   * Feed manifest chunk allows for a feed to be able to be resolved through `/bzz` endpoint.
   *
   * @param postageBatchId  Postage BatchId to be used to create the Feed Manifest
   * @param type            The type of the feed, can be 'epoch' or 'sequence'
   * @param topic           Topic in hex or bytes
   * @param owner           Owner's ethereum address in hex or bytes
   * @param options Options that affects the request behavior
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/dapps-on-swarm/feeds)
   * @see [Bee API reference - `POST /feeds`](https://docs.ethswarm.org/api/#tag/Feed/paths/~1feeds~1{owner}~1{topic}/post)
   */
  async createFeedManifest(
    postageBatchId: string | BatchId,
    type: FeedType,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    options?: BeeRequestOptions,
  ): Promise<FeedManifestResult> {
    assertRequestOptions(options)
    assertFeedType(type)
    assertBatchId(postageBatchId)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeHexEthAddress(owner)

    const reference = await createFeedManifest(
      this.getRequestOptionsForCall(options),
      canonicalOwner,
      canonicalTopic,
      postageBatchId,
    )

    return addCidConversionFunction({ reference }, ReferenceType.FEED)
  }

  /**
   * Make a new feed reader for downloading feed updates.
   *
   * @param type    The type of the feed, can be 'epoch' or 'sequence'
   * @param topic   Topic in hex or bytes
   * @param owner   Owner's ethereum address in hex or bytes
   * @param options Options that affects the request behavior
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/dapps-on-swarm/feeds)
   */
  makeFeedReader(
    type: FeedType,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    options?: BeeRequestOptions,
  ): FeedReader {
    assertRequestOptions(options)
    assertFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeHexEthAddress(owner)

    return makeFeedReader(this.getRequestOptionsForCall(options), type, canonicalTopic, canonicalOwner)
  }

  /**
   * Make a new feed writer for updating feeds
   *
   * @param type    The type of the feed, can be 'epoch' or 'sequence'
   * @param topic   Topic in hex or bytes
   * @param signer  The signer's private key or a Signer instance that can sign data
   * @param options Options that affects the request behavior
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/dapps-on-swarm/feeds)
   */
  makeFeedWriter(
    type: FeedType,
    topic: Topic | Uint8Array | string,
    signer?: Signer | Uint8Array | string,
    options?: BeeRequestOptions,
  ): FeedWriter {
    assertRequestOptions(options)
    assertFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalSigner = this.resolveSigner(signer)

    return makeFeedWriter(this.getRequestOptionsForCall(options), type, canonicalTopic, canonicalSigner)
  }

  /**
   * High-level function that allows you to easily set JSON data to feed.
   * JSON-like data types are supported.
   *
   * The default Signer of Bee instance is used if `options.signer` is not specified.
   * If none of those two is set error is thrown.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param topic Human readable string, that is internally hashed so there are no constrains there.
   * @param data JSON compatible data
   * @param options
   * @param options.signer Custom instance of Signer or string with private key.
   * @param options.type Type of Feed
   *
   * @throws BeeError if `options.signer` is not specified nor the default Signer on Bee's instance is specified.
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/dapps-on-swarm/feeds)
   */
  async setJsonFeed<T extends AnyJson>(
    postageBatchId: string | BatchId,
    topic: string,
    data: T,
    options?: JsonFeedOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Reference> {
    assertRequestOptions(options, 'JsonFeedOptions')
    assertBatchId(postageBatchId)

    const hashedTopic = this.makeFeedTopic(topic)
    const feedType = options?.type ?? DEFAULT_FEED_TYPE
    const writer = this.makeFeedWriter(feedType, hashedTopic, options?.signer, requestOptions)

    return setJsonData(this, writer, postageBatchId, data, options, requestOptions)
  }

  /**
   * High-level function that allows you to easily get data from feed.
   * Returned data are parsed using JSON.parse().
   *
   * This method also supports specification of `signer` object passed to constructor. The order of evaluation is:
   *  - `options.address`
   *  - `options.signer`
   *  - `this.signer`
   *
   * At least one of these has to be specified!
   *
   * @param topic Human readable string, that is internally hashed so there are no constrains there.
   * @param options
   * @param options.signer Custom instance of Signer or string with private key. This option is exclusive with `address` option.
   * @param options.address Ethereum address of owner of the feed that signed it. This option is exclusive with `signer` option.
   * @param options.type Type of Feed
   *
   * @see [Bee docs - Feeds](https://docs.ethswarm.org/docs/dapps-on-swarm/feeds)
   */
  async getJsonFeed<T extends AnyJson>(topic: string, options?: JsonFeedOptions): Promise<T> {
    assertRequestOptions(options, 'JsonFeedOptions')

    const hashedTopic = this.makeFeedTopic(topic)
    const feedType = options?.type ?? DEFAULT_FEED_TYPE

    if (options?.signer && options?.address) {
      throw new BeeError('Both options "signer" and "address" can not be specified at one time!')
    }

    let address: EthAddress

    if (options?.address) {
      address = makeEthAddress(options?.address)
    } else {
      try {
        address = this.resolveSigner(options?.signer).address
      } catch (e) {
        if (e instanceof BeeError) {
          throw new BeeError('Either address, signer or default signer has to be specified!')
        } else {
          throw e
        }
      }
    }

    const reader = this.makeFeedReader(feedType, hashedTopic, address, options)

    return getJsonData(this, reader)
  }

  /**
   * Make a new feed topic from a string
   *
   * Because the topic has to be 32 bytes long this function
   * hashes the input string to create a topic string of arbitrary length.
   *
   * @param topic The input string
   */
  makeFeedTopic(topic: string): Topic {
    return makeTopicFromString(topic)
  }

  /**
   * Returns an object for reading single owner chunks
   *
   * @param ownerAddress The ethereum address of the owner
   * @param options Options that affects the request behavior
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/dapps-on-swarm/chunk-types#single-owner-chunks)
   */
  makeSOCReader(ownerAddress: EthAddress | Uint8Array | string, options?: BeeRequestOptions): SOCReader {
    assertRequestOptions(options)
    const canonicalOwner = makeEthAddress(ownerAddress)

    return {
      owner: makeHexEthAddress(canonicalOwner),
      download: downloadSingleOwnerChunk.bind(null, this.getRequestOptionsForCall(options), canonicalOwner),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks
   *
   * @param signer The signer's private key or a Signer instance that can sign data
   * @param options Options that affects the request behavior
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/dapps-on-swarm/chunk-types#single-owner-chunks)
   */
  makeSOCWriter(signer?: Signer | Uint8Array | string, options?: BeeRequestOptions): SOCWriter {
    assertRequestOptions(options)
    const canonicalSigner = this.resolveSigner(signer)

    return {
      ...this.makeSOCReader(canonicalSigner.address, options),

      upload: uploadSingleOwnerChunkData.bind(null, this.getRequestOptionsForCall(options), canonicalSigner),
    }
  }

  /**
   * Ping the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param options Options that affects the request behavior
   * @throws If connection was not successful throw error
   */
  async checkConnection(options?: BeeRequestOptions): Promise<void> | never {
    assertRequestOptions(options, 'PostageBatchOptions')

    return status.checkConnection(this.getRequestOptionsForCall(options))
  }

  /**
   * Ping the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param options Options that affects the request behavior
   * @returns true if successful, false on error
   */
  async isConnected(options?: BeeRequestOptions): Promise<boolean> {
    assertRequestOptions(options, 'PostageBatchOptions')

    try {
      await status.checkConnection(this.getRequestOptionsForCall(options))
    } catch (e) {
      return false
    }

    return true
  }

  // Legacy debug API

  async getNodeAddresses(options?: BeeRequestOptions): Promise<NodeAddresses> {
    assertRequestOptions(options)

    return connectivity.getNodeAddresses(this.getRequestOptionsForCall(options))
  }

  async getBlocklist(options?: BeeRequestOptions): Promise<Peer[]> {
    assertRequestOptions(options)

    return connectivity.getBlocklist(this.getRequestOptionsForCall(options))
  }

  /**
   * Retrieve tag extended information from Bee node
   *
   * @param tagUid UID or tag object to be retrieved
   * @throws TypeError if tagUid is in not correct format
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags/{uid}`](https://docs.ethswarm.org/debug-api/#tag/Tag)
   *
   */
  async retrieveExtendedTag(tagUid: number | Tag, options?: BeeRequestOptions): Promise<ExtendedTag> {
    assertRequestOptions(options)

    if (isTag(tagUid)) {
      tagUid = tagUid.uid
    } else if (typeof tagUid === 'number') {
      assertNonNegativeInteger(tagUid, 'UID')
    } else {
      throw new TypeError('tagUid has to be either Tag or a number (UID)!')
    }

    return debugTag.retrieveExtendedTag(this.getRequestOptionsForCall(options), tagUid)
  }

  /**
   * Get list of peers for this node
   */
  async getPeers(options?: BeeRequestOptions): Promise<Peer[]> {
    assertRequestOptions(options)

    return connectivity.getPeers(this.getRequestOptionsForCall(options))
  }

  async removePeer(peer: string | Address, options?: BeeRequestOptions): Promise<RemovePeerResponse> {
    assertRequestOptions(options)
    assertAddress(peer)

    return connectivity.removePeer(this.getRequestOptionsForCall(options), peer)
  }

  async getTopology(options?: BeeRequestOptions): Promise<Topology> {
    assertRequestOptions(options)

    return connectivity.getTopology(this.getRequestOptionsForCall(options))
  }

  async pingPeer(peer: string | Address, options?: BeeRequestOptions): Promise<PingResponse> {
    assertRequestOptions(options)
    assertAddress(peer)

    return connectivity.pingPeer(this.getRequestOptionsForCall(options), peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  async getAllBalances(options?: BeeRequestOptions): Promise<BalanceResponse> {
    assertRequestOptions(options)

    return balance.getAllBalances(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Swarm address of peer
   */
  async getPeerBalance(address: Address | string, options?: BeeRequestOptions): Promise<PeerBalance> {
    assertRequestOptions(options)
    assertAddress(address)

    return balance.getPeerBalance(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  async getPastDueConsumptionBalances(options?: BeeRequestOptions): Promise<BalanceResponse> {
    assertRequestOptions(options)

    return balance.getPastDueConsumptionBalances(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Swarm address of peer
   */
  async getPastDueConsumptionPeerBalance(address: Address | string, options?: BeeRequestOptions): Promise<PeerBalance> {
    assertRequestOptions(options)
    assertAddress(address)

    return balance.getPastDueConsumptionPeerBalance(this.getRequestOptionsForCall(options), address)
  }

  /*
   * Chequebook endpoints
   */

  /**
   * Get the address of the chequebook contract used.
   *
   * **Warning:** The address is returned with 0x prefix unlike all other calls.
   * https://github.com/ethersphere/bee/issues/1443
   */
  async getChequebookAddress(options?: BeeRequestOptions): Promise<ChequebookAddressResponse> {
    assertRequestOptions(options)

    return chequebook.getChequebookAddress(this.getRequestOptionsForCall(options))
  }

  /**
   * Get the balance of the chequebook
   */
  async getChequebookBalance(options?: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
    assertRequestOptions(options)

    return chequebook.getChequebookBalance(this.getRequestOptionsForCall(options))
  }

  /**
   * Get last cheques for all peers
   */
  async getLastCheques(options?: BeeRequestOptions): Promise<LastChequesResponse> {
    assertRequestOptions(options)

    return chequebook.getLastCheques(this.getRequestOptionsForCall(options))
  }

  /**
   * Get last cheques for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastChequesForPeer(
    address: Address | string,
    options?: BeeRequestOptions,
  ): Promise<LastChequesForPeerResponse> {
    assertRequestOptions(options)
    assertAddress(address)

    return chequebook.getLastChequesForPeer(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Swarm address of peer
   */
  async getLastCashoutAction(
    address: Address | string,
    options?: BeeRequestOptions,
  ): Promise<LastCashoutActionResponse> {
    assertRequestOptions(options)
    assertAddress(address)

    return chequebook.getLastCashoutAction(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Cashout the last cheque for the peer
   *
   * @param address  Swarm address of peer
   * @param options
   * @param options.gasPrice Gas price for the cashout transaction in WEI
   * @param options.gasLimit Gas limit for the cashout transaction in WEI
   */
  async cashoutLastCheque(
    address: string | Address,
    options?: CashoutOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<string> {
    assertCashoutOptions(options)
    assertAddress(address)

    return chequebook.cashoutLastCheque(this.getRequestOptionsForCall(requestOptions), address, options)
  }

  /**
   * Deposit tokens from overlay address into chequebook
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async depositTokens(
    amount: number | NumberString,
    gasPrice?: NumberString,
    options?: BeeRequestOptions,
  ): Promise<string> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.depositTokens(this.getRequestOptionsForCall(options), amount, gasPrice)
  }

  /**
   * Withdraw tokens from the chequebook to the overlay address
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async withdrawTokens(
    amount: number | NumberString,
    gasPrice?: NumberString,
    options?: BeeRequestOptions,
  ): Promise<string> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.withdrawTokens(this.getRequestOptionsForCall(options), amount, gasPrice)
  }

  /*
   * Settlements endpoint
   */

  /**
   * Get amount of sent and received from settlements with a peer
   *
   * @param address  Swarm address of peer
   */
  async getSettlements(address: Address | string, options?: BeeRequestOptions): Promise<Settlements> {
    assertRequestOptions(options)
    assertAddress(address)

    return settlements.getSettlements(this.getRequestOptionsForCall(options), address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  async getAllSettlements(options?: BeeRequestOptions): Promise<AllSettlements> {
    assertRequestOptions(options)

    return settlements.getAllSettlements(this.getRequestOptionsForCall(options))
  }

  /**
   * Get status of node
   */
  async getStatus(options?: BeeRequestOptions): Promise<DebugStatus> {
    assertRequestOptions(options)

    return debugStatus.getDebugStatus(this.getRequestOptionsForCall(options))
  }

  /**
   * Get health of node
   */
  async getHealth(options?: BeeRequestOptions): Promise<Health> {
    assertRequestOptions(options)

    return debugStatus.getHealth(this.getRequestOptionsForCall(options))
  }

  /**
   * Get readiness of node
   */
  async getReadiness(options?: BeeRequestOptions): Promise<boolean> {
    assertRequestOptions(options)

    return debugStatus.getReadiness(this.getRequestOptionsForCall(options))
  }

  /**
   * Get mode information of node
   */
  async getNodeInfo(options?: BeeRequestOptions): Promise<NodeInfo> {
    assertRequestOptions(options)

    return debugStatus.getNodeInfo(this.getRequestOptionsForCall(options))
  }

  /**
   * Connnects to a node and checks if it is a supported Bee version by the bee-js
   *
   * @returns true if the Bee node version is supported
   * @deprecated Use `BeeDebug.isSupportedExactVersion()` instead
   */
  async isSupportedVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return debugStatus.isSupportedVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Connects to a node and checks if its version matches with the one that bee-js supports.
   *
   * Be aware that this is the most strict version check and most probably
   * you will want to use more relaxed API-versions based checks like
   * `BeeDebug.isSupportedApiVersion()`, `BeeDebug.isSupportedMainApiVersion()` or `BeeDebug.isSupportedDebugApiVersion()`
   * based on your use-case.
   *
   * @param options
   */
  async isSupportedExactVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return debugStatus.isSupportedExactVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Connects to a node and checks if its main's API version matches with the one that bee-js supports.
   *
   * This is useful if you are not using `BeeDebug` class (for anything else then this check)
   * and want to make sure about compatibility.
   *
   * @param options
   */
  async isSupportedMainApiVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return debugStatus.isSupportedMainApiVersion(this.getRequestOptionsForCall(options))
  }

  /**
   *
   * Connects to a node and checks if its Main API version matches with the one that bee-js supports.
   *
   * This should be the main way how to check compatibility for your app and Bee node.
   *
   * @param options
   */
  async isSupportedApiVersion(options?: BeeRequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return debugStatus.isSupportedApiVersion(this.getRequestOptionsForCall(options))
  }

  /**
   * Returns object with all versions specified by the connected Bee node (properties prefixed with `bee*`)
   * and versions that bee-js supports (properties prefixed with `supported*`).
   *
   * @param options
   */
  async getVersions(options?: BeeRequestOptions): Promise<BeeVersions> | never {
    assertRequestOptions(options)

    return debugStatus.getVersions(this.getRequestOptionsForCall(options))
  }

  /**
   * Get reserve state
   */
  async getReserveState(options?: BeeRequestOptions): Promise<ReserveState> {
    assertRequestOptions(options)

    return states.getReserveState(this.getRequestOptionsForCall(options))
  }

  /**
   * Get chain state
   */
  async getChainState(options?: BeeRequestOptions): Promise<ChainState> {
    assertRequestOptions(options)

    return states.getChainState(this.getRequestOptionsForCall(options))
  }

  /**
   * Get wallet balances for xDai and BZZ of the Bee node
   *
   * @param options
   */
  async getWalletBalance(options?: BeeRequestOptions): Promise<WalletBalance> {
    assertRequestOptions(options)

    return states.getWalletBalance(this.getRequestOptionsForCall(options))
  }

  /**
   * Creates new postage batch from the funds that the node has available in its Ethereum account.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param amount Amount that represents the value per chunk, has to be greater or equal zero.
   * @param depth Logarithm of the number of chunks that can be stamped with the batch.
   * @param options Options for creation of postage batch
   * @throws BeeArgumentError when negative amount or depth is specified
   * @throws TypeError if non-integer value is passed to amount or depth
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `POST /stamps`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{amount}~1{depth}/post)
   */
  async createPostageBatch(
    amount: NumberString,
    depth: number,
    options?: PostageBatchOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<BatchId> {
    assertPostageBatchOptions(options)
    assertPositiveInteger(amount)
    assertNonNegativeInteger(depth)

    if (depth < STAMPS_DEPTH_MIN) {
      throw new BeeArgumentError(`Depth has to be at least ${STAMPS_DEPTH_MIN}`, depth)
    }

    if (depth > STAMPS_DEPTH_MAX) {
      throw new BeeArgumentError(`Depth has to be at most ${STAMPS_DEPTH_MAX}`, depth)
    }

    if (parseInt(amount, 10) < STAMPS_AMOUNT_MIN) {
      throw new BeeArgumentError(`Amount has to be at least ${STAMPS_AMOUNT_MIN} (1 day)`, amount)
    }

    const stamp = await stamps.createPostageBatch(this.getRequestOptionsForCall(requestOptions), amount, depth, options)

    if (options?.waitForUsable !== false) {
      await this.waitForUsablePostageStamp(stamp, options?.waitForUsableTimeout)
    }

    return stamp
  }

  /**
   * Topup a fresh amount of BZZ to given Postage Batch.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param postageBatchId Batch ID
   * @param amount Amount to be added to the batch
   * @param options Request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1topup~1{id}~1{amount}/patch)
   */
  async topUpBatch(postageBatchId: BatchId | string, amount: NumberString, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount, 'Amount')
    assertBatchId(postageBatchId)

    await stamps.topUpBatch(this.getRequestOptionsForCall(options), postageBatchId, amount)
  }

  /**
   * Dilute given Postage Batch with new depth (that has to be bigger then the original depth), which allows
   * the Postage Batch to be used for more chunks.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param postageBatchId Batch ID
   * @param depth Amount to be added to the batch
   * @param options Request options
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1topup~1{id}~1{amount}/patch)
   */
  async diluteBatch(postageBatchId: BatchId | string, depth: number, options?: BeeRequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertNonNegativeInteger(depth, 'Depth')
    assertBatchId(postageBatchId)

    await stamps.diluteBatch(this.getRequestOptionsForCall(options), postageBatchId, depth)
  }

  /**
   * Return details for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{id}/get)
   */
  async getPostageBatch(postageBatchId: BatchId | string, options?: BeeRequestOptions): Promise<PostageBatch> {
    assertRequestOptions(options)
    assertBatchId(postageBatchId)

    return stamps.getPostageBatch(this.getRequestOptionsForCall(options), postageBatchId)
  }

  /**
   * Return detailed information related to buckets for specific postage batch.
   *
   * @param postageBatchId Batch ID
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps/${id}/buckets`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps~1{id}~1buckets/get)
   */
  async getPostageBatchBuckets(
    postageBatchId: BatchId | string,
    options?: BeeRequestOptions,
  ): Promise<PostageBatchBuckets> {
    assertRequestOptions(options)
    assertBatchId(postageBatchId)

    return stamps.getPostageBatchBuckets(this.getRequestOptionsForCall(options), postageBatchId)
  }

  /**
   * Return all postage batches that has the node available.
   *
   * @see [Bee docs - Keep your data alive / Postage stamps](https://docs.ethswarm.org/docs/access-the-swarm/keep-your-data-alive)
   * @see [Bee Debug API reference - `GET /stamps`](https://docs.ethswarm.org/debug-api/#tag/Postage-Stamps/paths/~1stamps/get)
   */
  async getAllPostageBatch(options?: BeeRequestOptions): Promise<PostageBatch[]> {
    assertRequestOptions(options)

    return stamps.getAllPostageBatches(this.getRequestOptionsForCall(options))
  }

  /**
   * Return all globally available postage batches.
   */
  async getAllGlobalPostageBatch(options?: BeeRequestOptions): Promise<PostageBatch[]> {
    assertRequestOptions(options)

    return stamps.getGlobalPostageBatches(this.getRequestOptionsForCall(options))
  }

  /**
   * Return lists of all current pending transactions that the Bee made
   */
  async getAllPendingTransactions(options?: BeeRequestOptions): Promise<TransactionInfo[]> {
    assertRequestOptions(options)

    return transactions.getAllTransactions(this.getRequestOptionsForCall(options))
  }

  /**
   * Return transaction information for specific transaction
   * @param transactionHash
   */
  async getPendingTransaction(
    transactionHash: TransactionHash | string,
    options?: BeeRequestOptions,
  ): Promise<TransactionInfo> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    return transactions.getTransaction(this.getRequestOptionsForCall(options), transactionHash)
  }

  /**
   * Rebroadcast already created transaction.
   * This is mainly needed when your transaction fall off mempool from other reason is not incorporated into block.
   *
   * @param transactionHash
   */
  async rebroadcastPendingTransaction(
    transactionHash: TransactionHash | string,
    options?: BeeRequestOptions,
  ): Promise<TransactionHash> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    return transactions.rebroadcastTransaction(this.getRequestOptionsForCall(options), transactionHash)
  }

  /**
   * Cancel currently pending transaction
   * @param transactionHash
   * @param gasPrice
   */
  async cancelPendingTransaction(
    transactionHash: TransactionHash | string,
    gasPrice?: NumberString,
    options?: BeeRequestOptions,
  ): Promise<TransactionHash> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return transactions.cancelTransaction(this.getRequestOptionsForCall(options), transactionHash, gasPrice)
  }

  /**
   * Gets the staked amount of BZZ (in PLUR unit) as number string.
   *
   * @param options
   */
  async getStake(options?: BeeRequestOptions): Promise<NumberString> {
    assertRequestOptions(options)

    return stake.getStake(this.getRequestOptionsForCall(options))
  }

  /**
   * Deposits given amount of BZZ token (in PLUR unit).
   *
   * Be aware that staked BZZ tokens can **not** be withdrawn.
   *
   * @param amount Amount of BZZ token (in PLUR unit) to be staked. Minimum is 100_000_000_000_000_000 PLUR (10 BZZ).
   * @param options
   */
  async depositStake(
    amount: NumberString,
    options?: TransactionOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    assertRequestOptions(options)
    assertTransactionOptions(options)

    await stake.stake(this.getRequestOptionsForCall(requestOptions), amount, options)
  }

  /**
   * Get current status of node in redistribution game
   *
   * @param options
   */
  async getRedistributionState(options?: BeeRequestOptions): Promise<RedistributionState> {
    assertRequestOptions(options)

    return stake.getRedistributionState(this.getRequestOptionsForCall(options))
  }

  private async waitForUsablePostageStamp(id: BatchId, timeout = 240_000): Promise<void> {
    const TIME_STEP = 3_000
    for (let time = 0; time < timeout; time += TIME_STEP) {
      try {
        const stamp = await this.getPostageBatch(id)

        if (stamp.usable) {
          return
        }
      } catch (error: any) {}

      await System.sleepMillis(TIME_STEP)
    }

    throw new BeeError('Timeout on waiting for postage stamp to become usable')
  }

  /**
   * @param signer
   * @private
   * @throws BeeError if either no Signer was passed or no default Signer was specified for the instance
   */
  private resolveSigner(signer?: Signer | Uint8Array | string): Signer {
    if (signer) {
      return makeSigner(signer)
    }

    if (this.signer) {
      return this.signer
    }

    throw new BeeError('You have to pass Signer as property to either the method call or constructor! Non found.')
  }

  private getRequestOptionsForCall(options?: BeeRequestOptions): BeeRequestOptions {
    return options ? Objects.deepMerge2(this.requestOptions, options) : this.requestOptions
  }
}
