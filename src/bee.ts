import * as bzz from './modules/bzz.js'
import * as stewardship from './modules/stewardship.js'
import * as tag from './modules/tag.js'
import * as pinning from './modules/pinning.js'
import * as bytes from './modules/bytes.js'
import * as chunk from './modules/chunk.js'
import * as pss from './modules/pss.js'
import * as status from './modules/status.js'

import { BeeArgumentError, BeeError } from './utils/error.js'
import { prepareWebsocketData } from './utils/data.js'
import { fileArrayBuffer, isFile } from './utils/file.js'
import { makeFeedReader, makeFeedWriter } from './feed/index.js'
import { makeSigner } from './chunk/signer.js'
import { assertFeedType, DEFAULT_FEED_TYPE, FeedType } from './feed/type.js'
import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData } from './chunk/soc.js'
import { makeTopic, makeTopicFromString } from './feed/topic.js'
import { createFeedManifest } from './modules/feed.js'
import { assertBeeUrl, stripLastSlash } from './utils/url.js'
import { EthAddress, makeEthAddress, makeHexEthAddress } from './utils/eth.js'
import { wrapBytesWithHelpers } from './utils/bytes.js'
import {
  assertAddressPrefix,
  assertAllTagsOptions,
  assertBatchId,
  assertCollectionUploadOptions,
  assertData,
  assertFileData,
  assertFileUploadOptions,
  assertPssMessageHandler,
  assertPublicKey,
  assertReference,
  assertRequestOptions,
  assertUploadOptions,
  makeTagUid,
} from './utils/type.js'
import { setJsonData, getJsonData } from './feed/json.js'
import { makeCollectionFromFileList, assertCollection } from './utils/collection.js'
import { makeCollectionFromFS } from './utils/collection.node.js'
import {
  AllTagsOptions,
  CHUNK_SIZE,
  Collection,
  Ky,
  Readable,
  RequestOptions,
  SPAN_SIZE,
  UploadResult,
} from './types/index.js'

import type { Options as KyOptions } from 'ky-universal'

import type {
  Tag,
  FileData,
  Reference,
  UploadOptions,
  PublicKey,
  AddressPrefix,
  PssMessageHandler,
  PssSubscription,
  CollectionUploadOptions,
  FileUploadOptions,
  Data,
  Signer,
  FeedReader,
  FeedWriter,
  SOCWriter,
  SOCReader,
  Topic,
  BeeOptions,
  JsonFeedOptions,
  AnyJson,
  Pin,
  BatchId,
} from './types/index.js'
import { makeDefaultKy, wrapRequestClosure, wrapResponseClosure } from './utils/http.js'
import { isReadable } from './utils/stream.js'

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
   * Ky instance that defines connection to Bee node
   * @private
   */
  private readonly ky: Ky

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

    const kyOptions: KyOptions = {
      prefixUrl: this.url,
      timeout: options?.timeout ?? false,
      retry: options?.retry,
      fetch: options?.fetch,
      hooks: {
        beforeRequest: [],
        afterResponse: [],
      },
    }

    if (options?.defaultHeaders) {
      kyOptions.headers = options.defaultHeaders
    }

    if (options?.onRequest) {
      kyOptions.hooks!.beforeRequest!.push(wrapRequestClosure(options.onRequest))
    }

    if (options?.onResponse) {
      kyOptions.hooks!.afterResponse!.push(wrapResponseClosure(options.onResponse))
    }

    this.ky = makeDefaultKy(kyOptions)
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
    options?: UploadOptions,
  ): Promise<UploadResult> {
    assertBatchId(postageBatchId)
    assertData(data)

    if (options) assertUploadOptions(options)

    return bytes.upload(this.getKy(options), data, postageBatchId, options)
  }

  /**
   * Download data as a byte array
   *
   * @param reference Bee data reference
   * @param options Options that affects the request behavior
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)
   */
  async downloadData(reference: Reference | string, options?: RequestOptions): Promise<Data> {
    assertRequestOptions(options)
    assertReference(reference)

    return bytes.download(this.getKy(options), reference)
  }

  /**
   * Download data as a Readable stream
   *
   * @param reference Bee data reference
   * @param options Options that affects the request behavior
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bytes`](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)
   */
  async downloadReadableData(
    reference: Reference | string,
    options?: RequestOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    assertRequestOptions(options)
    assertReference(reference)

    return bytes.downloadReadable(this.getKy(options), reference)
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
  async uploadChunk(postageBatchId: string | BatchId, data: Uint8Array, options?: UploadOptions): Promise<Reference> {
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

    return chunk.upload(this.getKy(options), data, postageBatchId, options)
  }

  /**
   * Download chunk as a byte array
   *
   * @param reference Bee chunk reference
   * @param options Options that affects the request behavior
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /chunks`](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks~1{reference}/get)
   */
  async downloadChunk(reference: Reference | string, options?: RequestOptions): Promise<Data> {
    assertRequestOptions(options)
    assertReference(reference)

    return chunk.download(this.getKy(options), reference)
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
    options?: FileUploadOptions,
  ): Promise<UploadResult> {
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

      return bzz.uploadFile(this.getKy(options), fileData, postageBatchId, fileName, fileOptions)
    } else if (isReadable(data) && options?.tag && !options.size) {
      // TODO: Needed until https://github.com/ethersphere/bee/issues/2317 is resolved
      const result = await bzz.uploadFile(this.getKy(options), data, postageBatchId, name, options)
      await this.updateTag(options.tag, result.reference)

      return result
    } else {
      return bzz.uploadFile(this.getKy(options), data, postageBatchId, name, options)
    }
  }

  /**
   * Download single file.
   *
   * @param reference Bee file reference
   * @param path If reference points to manifest, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   *
   * @see Data
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz~1{reference}~1{path}/get)
   */
  async downloadFile(reference: Reference | string, path = '', options?: RequestOptions): Promise<FileData<Data>> {
    assertRequestOptions(options)
    assertReference(reference)

    return bzz.downloadFile(this.getKy(options), reference, path)
  }

  /**
   * Download single file as a readable stream
   *
   * @param reference Hash reference to file
   * @param path If reference points to manifest / collections, then this parameter defines path to the file
   * @param options Options that affects the request behavior
   *
   * @see [Bee docs - Upload and download](https://docs.ethswarm.org/docs/access-the-swarm/upload-and-download)
   * @see [Bee API reference - `GET /bzz`](https://docs.ethswarm.org/api/#tag/Collection/paths/~1bzz~1{reference}~1{path}/get)
   */
  async downloadReadableFile(
    reference: Reference | string,
    path = '',
    options?: RequestOptions,
  ): Promise<FileData<ReadableStream<Uint8Array>>> {
    assertRequestOptions(options)
    assertReference(reference)

    return bzz.downloadFileReadable(this.getKy(options), reference, path)
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
    options?: CollectionUploadOptions,
  ): Promise<UploadResult> {
    assertBatchId(postageBatchId)

    if (options) assertCollectionUploadOptions(options)

    const data = await makeCollectionFromFileList(fileList)

    return bzz.uploadCollection(this.getKy(options), data, postageBatchId, options)
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
    collection: Collection<Uint8Array | Readable>,
    options?: CollectionUploadOptions,
  ): Promise<UploadResult> {
    assertBatchId(postageBatchId)
    assertCollection(collection)

    if (options) assertCollectionUploadOptions(options)

    return bzz.uploadCollection(this.ky, collection, postageBatchId, options)
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
    options?: CollectionUploadOptions,
  ): Promise<UploadResult> {
    assertBatchId(postageBatchId)

    if (options) assertCollectionUploadOptions(options)
    const data = await makeCollectionFromFS(dir)

    return bzz.uploadCollection(this.getKy(options), data, postageBatchId, options)
  }

  /**
   * Create a new Tag which is meant for tracking progres of syncing data across network.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param options Options that affects the request behavior
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `POST /tags`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/post)
   */
  async createTag(options?: RequestOptions): Promise<Tag> {
    assertRequestOptions(options)

    return tag.createTag(this.getKy(options))
  }

  /**
   * Fetches all tags.
   *
   * The listing is limited by options.limit. So you have to iterate using options.offset to get all tags.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
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

    return tag.getAllTags(this.getKy(options), options?.offset, options?.limit)
  }

  /**
   * Retrieve tag information from Bee node
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param tagUid UID or tag object to be retrieved
   * @param options Options that affects the request behavior
   * @throws TypeError if tagUid is in not correct format
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `GET /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/get)
   *
   */
  async retrieveTag(tagUid: number | Tag, options?: RequestOptions): Promise<Tag> {
    assertRequestOptions(options)

    tagUid = makeTagUid(tagUid)

    return tag.retrieveTag(this.getKy(options), tagUid)
  }

  /**
   * Delete Tag
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param tagUid UID or tag object to be retrieved
   * @param options Options that affects the request behavior
   * @throws TypeError if tagUid is in not correct format
   * @throws BeeResponse error if something went wrong on the Bee node side while deleting the tag.
   *
   * @see [Bee docs - Syncing / Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing)
   * @see [Bee API reference - `DELETE /tags/{uid}`](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1{uid}/delete)
   */
  async deleteTag(tagUid: number | Tag, options?: RequestOptions): Promise<void> {
    assertRequestOptions(options)

    tagUid = makeTagUid(tagUid)

    return tag.deleteTag(this.getKy(options), tagUid)
  }

  /**
   * Update tag's total chunks count.
   *
   * This is important if you are uploading individual chunks with a tag. Then upon finishing the final root chunk,
   * you can use this method to update the total chunks count for the tag.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
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
  async updateTag(tagUid: number | Tag, reference: Reference | string, options?: RequestOptions): Promise<void> {
    assertReference(reference)
    assertRequestOptions(options)

    tagUid = makeTagUid(tagUid)

    return tag.updateTag(this.getKy(options), tagUid, reference)
  }

  /**
   * Pin local data with given reference
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param reference Data reference
   * @param options Options that affects the request behavior
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async pin(reference: Reference | string, options?: RequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertReference(reference)

    return pinning.pin(this.getKy(options), reference)
  }

  /**
   * Unpin local data with given reference
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param reference Data reference
   * @param options Options that affects the request behavior
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async unpin(reference: Reference | string, options?: RequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertReference(reference)

    return pinning.unpin(this.getKy(options), reference)
  }

  /**
   * Get list of all locally pinned references
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param options Options that affects the request behavior
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async getAllPins(options?: RequestOptions): Promise<Reference[]> {
    assertRequestOptions(options)

    return pinning.getAllPins(this.getKy(options))
  }

  /**
   * Get pinning status of chunk with given reference
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @param reference Bee data reference
   * @param options Options that affects the request behavior
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee docs - Pinning](https://docs.ethswarm.org/docs/access-the-swarm/pinning)
   */
  async getPin(reference: Reference | string, options?: RequestOptions): Promise<Pin> {
    assertRequestOptions(options)
    assertReference(reference)

    return pinning.getPin(this.getKy(options), reference)
  }

  /**
   * Instructs the Bee node to reupload a locally pinned data into the network.
   *
   * @param reference
   * @param options Options that affects the request behavior
   * @throws BeeArgumentError if the reference is not locally pinned
   * @throws TypeError if reference is in not correct format
   *
   * @see [Bee API reference - `PUT /stewardship`](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1{reference}/put)
   */
  async reuploadPinnedData(reference: Reference | string, options?: RequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertReference(reference)

    await stewardship.reupload(this.getKy(options), reference)
  }

  /**
   * Checks if content specified by reference is retrievable from the network.
   *
   * @param reference The checked content
   * @param options Options that affects the request behavior
   *
   * @see [Bee API reference - `GET /stewardship`](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1{reference}/get)
   */
  async isReferenceRetrievable(reference: Reference | string, options?: RequestOptions): Promise<boolean> {
    assertRequestOptions(options)
    assertReference(reference)

    return stewardship.isRetrievable(this.getKy(options), reference)
  }

  /**
   * Send data to recipient or target with Postal Service for Swarm.
   *
   * Because sending a PSS message is slow and CPU intensive,
   * it is not supposed to be used for general messaging but
   * most likely for setting up an encrypted communication
   * channel by sending an one-off message.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
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
    options?: RequestOptions,
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

      return pss.send(this.getKy(options), topic, target, data, postageBatchId, recipient)
    } else {
      return pss.send(this.getKy(options), topic, target, data, postageBatchId)
    }
  }

  /**
   * Subscribe to messages for given topic with Postal Service for Swarm
   *
   * **Warning! Not allowed when node is in Gateway mode!**
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
   * **Warning! Not allowed when node is in Gateway mode!**
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
    options?: RequestOptions,
  ): Promise<Reference> {
    assertRequestOptions(options)
    assertFeedType(type)
    assertBatchId(postageBatchId)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeHexEthAddress(owner)

    return createFeedManifest(this.getKy(options), canonicalOwner, canonicalTopic, postageBatchId, { type })
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
    options?: RequestOptions,
  ): FeedReader {
    assertRequestOptions(options)
    assertFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeHexEthAddress(owner)

    return makeFeedReader(this.getKy(options), type, canonicalTopic, canonicalOwner)
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
    options?: RequestOptions,
  ): FeedWriter {
    assertRequestOptions(options)
    assertFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalSigner = this.resolveSigner(signer)

    return makeFeedWriter(this.getKy(options), type, canonicalTopic, canonicalSigner)
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
  ): Promise<Reference> {
    assertRequestOptions(options, 'JsonFeedOptions')
    assertBatchId(postageBatchId)

    const hashedTopic = this.makeFeedTopic(topic)
    const feedType = options?.type ?? DEFAULT_FEED_TYPE
    const writer = this.makeFeedWriter(feedType, hashedTopic, options?.signer, options)

    return setJsonData(this, writer, postageBatchId, data, options)
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
  makeSOCReader(ownerAddress: EthAddress | Uint8Array | string, options?: RequestOptions): SOCReader {
    assertRequestOptions(options)
    const canonicalOwner = makeEthAddress(ownerAddress)

    return {
      owner: makeHexEthAddress(canonicalOwner),
      download: downloadSingleOwnerChunk.bind(null, this.getKy(options), canonicalOwner),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks
   *
   * @param signer The signer's private key or a Signer instance that can sign data
   * @param options Options that affects the request behavior
   * @see [Bee docs - Chunk Types](https://docs.ethswarm.org/docs/dapps-on-swarm/chunk-types#single-owner-chunks)
   */
  makeSOCWriter(signer?: Signer | Uint8Array | string, options?: RequestOptions): SOCWriter {
    assertRequestOptions(options)
    const canonicalSigner = this.resolveSigner(signer)

    return {
      ...this.makeSOCReader(canonicalSigner.address, options),

      upload: uploadSingleOwnerChunkData.bind(null, this.getKy(options), canonicalSigner),
    }
  }

  /**
   * Ping the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param options Options that affects the request behavior
   * @throws If connection was not successful throw error
   */
  async checkConnection(options?: RequestOptions): Promise<void> | never {
    assertRequestOptions(options, 'PostageBatchOptions')

    return status.checkConnection(this.getKy(options))
  }

  /**
   * Ping the Bee node to see if there is a live Bee node on the given URL.
   *
   * @param options Options that affects the request behavior
   * @returns true if successful, false on error
   */
  async isConnected(options?: RequestOptions): Promise<boolean> {
    assertRequestOptions(options, 'PostageBatchOptions')

    try {
      await status.checkConnection(this.getKy(options))
    } catch (e) {
      return false
    }

    return true
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

  private getKy(options?: RequestOptions): Ky {
    if (!options) {
      return this.ky
    }

    return this.ky.extend(options)
  }
}
