import { AxiosRequestConfig } from 'axios'
import type { Readable } from 'stream'
import { makeSigner } from './chunk/signer'
import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData } from './chunk/soc'
import { makeFeedReader, makeFeedWriter } from './feed'
import { getJsonData, setJsonData } from './feed/json'
import { makeTopic, makeTopicFromString } from './feed/topic'
import { assertFeedType, DEFAULT_FEED_TYPE, FeedType } from './feed/type'
import * as bytes from './modules/bytes'
import * as bzz from './modules/bzz'
import { createFeedManifest } from './modules/feed'
import * as pinning from './modules/pinning'
import * as pss from './modules/pss'
import * as status from './modules/status'
import * as tag from './modules/tag'
import type {
  AddressPrefix,
  AnyJson,
  BatchId,
  BeeOptions,
  CollectionUploadOptions,
  Data,
  FeedReader,
  FeedWriter,
  FileData,
  FileUploadOptions,
  JsonFeedOptions,
  Pin,
  PssMessageHandler,
  PssSubscription,
  PublicKey,
  Reference,
  Signer,
  SOCReader,
  SOCWriter,
  Tag,
  Topic,
  UploadOptions,
} from './types'
import { wrapBytesWithHelpers } from './utils/bytes'
import { makeCollectionFromFileList, makeCollectionFromFS } from './utils/collection'
import { prepareWebsocketData } from './utils/data'
import { BeeArgumentError, BeeError } from './utils/error'
import { EthAddress, makeEthAddress, makeHexEthAddress } from './utils/eth'
import { fileArrayBuffer, isFile } from './utils/file'
import {
  assertAddressPrefix,
  assertBatchId,
  assertCollectionUploadOptions,
  assertData,
  assertFileData,
  assertFileUploadOptions,
  assertNonNegativeInteger,
  assertPssMessageHandler,
  assertPublicKey,
  assertReference,
  assertUploadOptions,
  isTag
} from './utils/type'
import { assertBeeUrl, stripLastSlash } from './utils/url'

/**
 * The Bee class provides a way of interacting with the Bee APIs based on the provided url
 */
export class Bee {
  public readonly url: string

  /**
   * Default Signer used for signing operations, mainly Feeds.
   */
  public readonly signer?: Signer

  /**
   * @param url URL of a running Bee node
   * @param options
   * @param options.signer Signer object or private key of the Signer in form of either hex string or Uint8Array that will be default signer for the instance.
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
  }

  /**
   * Upload data to a Bee node
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data to be uploaded
   * @param options Additional options like tag, encryption, pinning, content-type
   *
   * @returns reference is a content hash of the data
   */
  async uploadData(
    postageBatchId: string | BatchId,
    data: string | Uint8Array,
    options?: UploadOptions,
  ): Promise<Reference> {
    assertBatchId(postageBatchId)
    assertData(data)

    if (options) assertUploadOptions(options)

    return bytes.upload(this.url, data, postageBatchId, options)
  }

  /**
   * Download data as a byte array
   *
   * @param reference Bee data reference
   */
  async downloadData(reference: Reference | string): Promise<Data> {
    assertReference(reference)

    return bytes.download(this.url, reference)
  }

  /**
   * Download data as a readable stream
   *
   * @param reference Bee data reference
   * @param axiosOptions optional - alter default options of axios HTTP client
   */
  async downloadReadableData(reference: Reference | string, axiosOptions?: AxiosRequestConfig): Promise<Readable> {
    assertReference(reference)

    return bytes.downloadReadable(this.url, reference, axiosOptions)
  }

  /**
   * Upload single file to a Bee node
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Name of the uploaded file (optional)
   * @param options Additional options like tag, encryption, pinning, content-type
   *
   * @returns reference is a content hash of the file
   */
  async uploadFile(
    postageBatchId: string | BatchId,
    data: string | Uint8Array | Readable | File,
    name?: string,
    options?: FileUploadOptions,
  ): Promise<Reference> {
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

      return bzz.uploadFile(this.url, fileData, postageBatchId, fileName, fileOptions)
    } else {
      return bzz.uploadFile(this.url, data, postageBatchId, name, options)
    }
  }

  /**
   * Download single file as a byte array
   *
   * @param reference Bee file reference
   * @param path If reference points to manifest, then this parameter defines path to the file
   */
  async downloadFile(reference: Reference | string, path = ''): Promise<FileData<Data>> {
    assertReference(reference)

    return bzz.downloadFile(this.url, reference, path)
  }

  /**
   * Download single file as a readable stream
   *
   * @param reference Bee file reference
   * @param path If reference points to manifest, then this parameter defines path to the file
   */
  async downloadReadableFile(reference: Reference | string, path = ''): Promise<FileData<Readable>> {
    assertReference(reference)

    return bzz.downloadFileReadable(this.url, reference, path)
  }

  /**
   * Upload collection of files to a Bee node
   *
   * Uses the FileList API from the browser.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param fileList list of files to be uploaded
   * @param options Additional options like tag, encryption, pinning
   *
   * @returns reference of the collection of files
   */
  async uploadFiles(
    postageBatchId: string | BatchId,
    fileList: FileList | File[],
    options?: CollectionUploadOptions,
  ): Promise<Reference> {
    assertBatchId(postageBatchId)

    if (options) assertCollectionUploadOptions(options)

    const data = await makeCollectionFromFileList(fileList)

    return bzz.uploadCollection(this.url, data, postageBatchId, options)
  }

  /**
   * Upload collection of files to a Bee node
   *
   * Uses the `fs` module of Node.js
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param dir the path of the files to be uploaded
   * @param options Additional options like tag, encryption, pinning
   *
   * @returns reference of the collection of files
   */
  async uploadFilesFromDirectory(
    postageBatchId: string | BatchId,
    dir: string,
    options?: CollectionUploadOptions,
  ): Promise<Reference> {
    assertBatchId(postageBatchId)

    if (options) assertCollectionUploadOptions(options)
    const data = await makeCollectionFromFS(dir)

    return bzz.uploadCollection(this.url, data, postageBatchId, options)
  }

  /**
   * Create new tag
   */
  async createTag(): Promise<Tag> {
    return tag.createTag(this.url)
  }

  /**
   * Retrieve tag information from Bee node
   *
   * @param tagUid UID or tag object to be retrieved
   */
  async retrieveTag(tagUid: number | Tag): Promise<Tag> {
    if (isTag(tagUid)) {
      tagUid = tagUid.uid
    } else if (typeof tagUid === 'number') {
      assertNonNegativeInteger(tagUid, 'UID')
    } else {
      throw new TypeError('tagUid has to be either Tag or a number (UID)!')
    }

    return tag.retrieveTag(this.url, tagUid)
  }

  /**
   * Pin data with given reference
   *
   * @param reference Bee data reference
   */
  async pin(reference: Reference | string): Promise<void> {
    assertReference(reference)

    return pinning.pin(this.url, reference)
  }

  /**
   * Unpin data with given reference
   *
   * @param reference Bee data reference
   */
  async unpin(reference: Reference | string): Promise<void> {
    assertReference(reference)

    return pinning.unpin(this.url, reference)
  }

  /**
   * Get list of all pinned references
   */
  async getAllPins(): Promise<Reference[]> {
    return pinning.getAllPins(this.url)
  }

  /**
   * Get pinning status of chunk with given reference
   *
   * @param reference Bee data reference
   */
  async getPin(reference: Reference | string): Promise<Pin> {
    assertReference(reference)

    return pinning.getPin(this.url, reference)
  }

  /**
   * Instructs the Bee node to reupload a locally pinned data into the network.
   *
   * @param reference
   * @param axiosOptions
   * @throws BeeArgumentError if the reference is not locally pinned
   */
  async reuploadPinnedData(reference: Reference | string, axiosOptions?: AxiosRequestConfig): Promise<void> {
    assertReference(reference)

    try {
      // TODO: This should be detected by Bee, but until https://github.com/ethersphere/bee/issues/1803 is resolved
      //  it is good idea to do some input validation on our side.
      await this.getPin(reference)
    } catch (e) {
      if (e.status === 404) {
        throw new BeeArgumentError('The passed reference is not locally pinned!', reference)
      }
    }

    await bzz.reupload(this.url, reference, axiosOptions)
  }

  /**
   * Send to recipient or target with Postal Service for Swarm
   *
   * @param postageBatchId Postage BatchId that will be assigned to sent message
   * @param topic Topic name
   * @param target Target message address prefix
   * @param data Message to be sent
   * @param recipient Recipient public key
   */
  async pssSend(
    postageBatchId: string | BatchId,
    topic: string,
    target: AddressPrefix,
    data: string | Uint8Array,
    recipient?: string | PublicKey,
  ): Promise<void> {
    assertData(data)
    assertBatchId(postageBatchId)
    assertAddressPrefix(target)

    if (typeof topic !== 'string') {
      throw new TypeError('topic has to be an string!')
    }

    if (recipient) {
      assertPublicKey(recipient)

      return pss.send(this.url, topic, target, data, postageBatchId, recipient)
    } else {
      return pss.send(this.url, topic, target, data, postageBatchId)
    }
  }

  /**
   * Subscribe to messages with Postal Service for Swarm
   *
   * @param topic Topic name
   * @param handler Message handler interface
   *
   * @returns Subscription to a given topic
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
   * channel by sending a one-off message.
   *
   * This is a helper function to wait for exactly one message to
   * arrive and then cancel the subscription. Additionally a
   * timeout can be provided for the message to arrive or else
   * an error will be thrown.
   *
   * @param topic Topic name
   * @param timeoutMsec Timeout in milliseconds
   *
   * @returns Message in byte array
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
        timeout = (setTimeout(() => {
          subscription.cancel()
          reject(new BeeError('pssReceive timeout'))
        }, timeoutMsec) as unknown) as number
      }
    })
  }

  /**
   * Create feed manifest chunk and return the reference to it
   *
   * @param postageBatchId  Postage BatchId to be used to create the Feed Manifest
   * @param type            The type of the feed, can be 'epoch' or 'sequence'
   * @param topic           Topic in hex or bytes
   * @param owner           Owner's ethereum address in hex or bytes
   */
  async createFeedManifest(
    postageBatchId: string | BatchId,
    type: FeedType,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
  ): Promise<Reference> {
    assertFeedType(type)
    assertBatchId(postageBatchId)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeHexEthAddress(owner)

    return createFeedManifest(this.url, canonicalOwner, canonicalTopic, postageBatchId, { type })
  }

  /**
   * Make a new feed reader for downloading feed updates
   *
   * @param type    The type of the feed, can be 'epoch' or 'sequence'
   * @param topic   Topic in hex or bytes
   * @param owner   Owner's ethereum address in hex or bytes
   */
  makeFeedReader(
    type: FeedType,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
  ): FeedReader {
    assertFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeHexEthAddress(owner)

    return makeFeedReader(this.url, type, canonicalTopic, canonicalOwner)
  }

  /**
   * Make a new feed writer for updating feeds
   *
   * @param type    The type of the feed, can be 'epoch' or 'sequence'
   * @param topic   Topic in hex or bytes
   * @param signer  The signer's private key or a Signer instance that can sign data
   */
  makeFeedWriter(
    type: FeedType,
    topic: Topic | Uint8Array | string,
    signer?: Signer | Uint8Array | string,
  ): FeedWriter {
    assertFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalSigner = this.resolveSigner(signer)

    return makeFeedWriter(this.url, type, canonicalTopic, canonicalSigner)
  }

  /**
   * High-level function that allows you to easily set JSON data to feed.
   * JSON-like data types are supported.
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param topic Human readable string, that is internally hashed so there are no constrains there.
   * @param data JSON compatible data
   * @param options
   * @param options.signer Custom instance of Signer or string with private key.
   * @param options.type Type of Feed
   */
  async setJsonFeed<T extends AnyJson>(
    postageBatchId: string | BatchId,
    topic: string,
    data: T,
    options?: JsonFeedOptions,
  ): Promise<Reference> {
    assertBatchId(postageBatchId)

    const hashedTopic = this.makeFeedTopic(topic)
    const feedType = options?.type ?? DEFAULT_FEED_TYPE
    const writer = this.makeFeedWriter(feedType, hashedTopic, options?.signer)

    return setJsonData(this, writer, postageBatchId, data)
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
   */
  async getJsonFeed<T extends AnyJson>(topic: string, options?: JsonFeedOptions): Promise<T> {
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

    const reader = this.makeFeedReader(feedType, hashedTopic, address)

    return getJsonData(this, reader)
  }

  /**
   * Make a new feed topic from a string
   *
   * Because the topic has to be 32 bytes long this function
   * hashes the input string to create a topic.
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
   */
  makeSOCReader(ownerAddress: EthAddress | Uint8Array | string): SOCReader {
    const canonicalOwner = makeEthAddress(ownerAddress)

    return {
      download: downloadSingleOwnerChunk.bind(null, this.url, canonicalOwner),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks
   *
   * @param signer The signer's private key or a Signer instance that can sign data
   */
  makeSOCWriter(signer?: Signer | Uint8Array | string): SOCWriter {
    const canonicalSigner = this.resolveSigner(signer)

    return {
      ...this.makeSOCReader(canonicalSigner.address),

      upload: uploadSingleOwnerChunkData.bind(null, this.url, canonicalSigner),
    }
  }

  /**
   * Ping the base bee URL. If connection was not successful throw error
   */
  async checkConnection(): Promise<void> | never {
    return status.checkConnection(this.url)
  }

  /**
   * Ping the base bee URL.
   *
   * @returns true if successful, false on error
   */
  async isConnected(): Promise<boolean> {
    try {
      await status.checkConnection(this.url)
    } catch (e) {
      return false
    }

    return true
  }

  private resolveSigner(signer?: Signer | Uint8Array | string): Signer {
    if (signer) {
      return makeSigner(signer)
    }

    if (this.signer) {
      return this.signer
    }

    throw new BeeError('You have to pass Signer as property to either the method call or constructor! Non found.')
  }
}
