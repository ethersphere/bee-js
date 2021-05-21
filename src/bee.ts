import type { Readable } from 'stream'
import * as bzz from './modules/bzz'
import * as tag from './modules/tag'
import * as pinning from './modules/pinning'
import * as bytes from './modules/bytes'
import * as pss from './modules/pss'
import * as status from './modules/status'
import * as stamps from './modules/stamps'
import type {
  Tag,
  FileData,
  Reference,
  UploadOptions,
  PublicKey,
  AddressPrefix,
  PssMessageHandler,
  PssSubscription,
  BeeResponse,
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
  ReferenceResponse,
  JsonFeedOptions,
  AnyJson,
  Pin,
  Address,
  PostageBatch,
} from './types'
import { BeeArgumentError, BeeError } from './utils/error'
import { prepareWebsocketData } from './utils/data'
import { fileArrayBuffer, isFile } from './utils/file'
import { AxiosRequestConfig } from 'axios'
import { makeFeedReader, makeFeedWriter } from './feed'
import { makeSigner } from './chunk/signer'
import { assertFeedType, DEFAULT_FEED_TYPE, FeedType } from './feed/type'
import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData } from './chunk/soc'
import { makeTopic, makeTopicFromString } from './feed/topic'
import { createFeedManifest } from './modules/feed'
import { assertBeeUrl, stripLastSlash } from './utils/url'
import { EthAddress, makeEthAddress, makeHexEthAddress } from './utils/eth'
import { wrapBytesWithHelpers } from './utils/bytes'
import { assertAddress, assertNonNegativeInteger, assertReference } from './utils/type'
import { setJsonData, getJsonData } from './feed/json'
import { makeCollectionFromFS, makeCollectionFromFileList } from './utils/collection'
import { PostageBatchOptions } from './types'

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
  uploadData(postageBatchId: string | Address, data: string | Uint8Array, options?: UploadOptions): Promise<Reference> {
    assertAddress(postageBatchId)

    return bytes.upload(this.url, data, postageBatchId, options)
  }

  /**
   * Download data as a byte array
   *
   * @param reference Bee data reference
   */
  downloadData(reference: Reference | string): Promise<Data> {
    assertReference(reference)

    return bytes.download(this.url, reference)
  }

  /**
   * Download data as a readable stream
   *
   * @param reference Bee data reference
   * @param axiosOptions optional - alter default options of axios HTTP client
   */
  downloadReadableData(reference: Reference | string, axiosOptions?: AxiosRequestConfig): Promise<Readable> {
    assertReference(reference)

    return bytes.downloadReadable(this.url, reference, axiosOptions)
  }

  /**
   * Upload single file to a Bee node
   *
   * @param postageBatchId Postage BatchId to be used to upload the data with
   * @param data    Data or file to be uploaded
   * @param name    Name of the uploaded file (optional)
   * @param options Aditional options like tag, encryption, pinning, content-type
   *
   * @returns reference is a content hash of the file
   */
  async uploadFile(
    postageBatchId: string | Address,
    data: string | Uint8Array | Readable | File,
    name?: string,
    options?: FileUploadOptions,
  ): Promise<Reference> {
    assertAddress(postageBatchId)

    if (isFile(data)) {
      const fileData = await fileArrayBuffer(data)
      const fileName = name || data.name
      const contentType = data.type
      const fileOptions = options !== undefined ? { contentType, ...options } : { contentType }

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
  downloadFile(reference: Reference | string, path = ''): Promise<FileData<Data>> {
    assertReference(reference)

    return bzz.downloadFile(this.url, reference, path)
  }

  /**
   * Download single file as a readable stream
   *
   * @param reference Bee file reference
   * @param path If reference points to manifest, then this parameter defines path to the file
   */
  downloadReadableFile(reference: Reference | string, path = ''): Promise<FileData<Readable>> {
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
    postageBatchId: string | Address,
    fileList: FileList | File[],
    options?: CollectionUploadOptions,
  ): Promise<Reference> {
    assertAddress(postageBatchId)
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
    postageBatchId: string | Address,
    dir: string,
    options?: CollectionUploadOptions,
  ): Promise<Reference> {
    assertAddress(postageBatchId)
    const data = await makeCollectionFromFS(dir)

    return bzz.uploadCollection(this.url, data, postageBatchId, options)
  }

  /**
   * Create new tag
   */
  createTag(): Promise<Tag> {
    return tag.createTag(this.url)
  }

  /**
   * Retrieve tag information from Bee node
   *
   * @param tagUid UID or tag object to be retrieved
   */
  retrieveTag(tagUid: number | Tag): Promise<Tag> {
    return tag.retrieveTag(this.url, tagUid)
  }

  /**
   * Pin data with given reference
   *
   * @param reference Bee data reference
   */
  pin(reference: Reference | string): Promise<BeeResponse> {
    assertReference(reference)

    return pinning.pin(this.url, reference)
  }

  /**
   * Unpin data with given reference
   *
   * @param reference Bee data reference
   */
  unpin(reference: Reference | string): Promise<BeeResponse> {
    assertReference(reference)

    return pinning.unpin(this.url, reference)
  }

  /**
   * Get list of all pinned references
   */
  getAllPins(): Promise<Reference[]> {
    return pinning.getAllPins(this.url)
  }

  /**
   * Get pinning status of chunk with given reference
   *
   * @param reference Bee data reference
   */
  getPin(reference: Reference | string): Promise<Pin> {
    assertReference(reference)

    return pinning.getPin(this.url, reference)
  }

  async reuploadPinnedData(reference: Reference | string): Promise<void> {
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

    await bzz.reupload(this.url, reference)
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
  pssSend(
    postageBatchId: string | Address,
    topic: string,
    target: AddressPrefix,
    data: string | Uint8Array,
    recipient?: PublicKey,
  ): Promise<BeeResponse> {
    assertAddress(postageBatchId)

    return pss.send(this.url, topic, target, data, postageBatchId, recipient)
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
  pssReceive(topic: string, timeoutMsec = 0): Promise<Data> {
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
  createFeedManifest(
    postageBatchId: string | Address,
    type: FeedType,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
  ): Promise<Reference> {
    assertFeedType(type)
    assertAddress(postageBatchId)

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
  setJsonFeed<T extends AnyJson>(
    postageBatchId: string | Address,
    topic: string,
    data: T,
    options?: JsonFeedOptions,
  ): Promise<ReferenceResponse> {
    assertAddress(postageBatchId)

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
  getJsonFeed<T extends AnyJson>(topic: string, options?: JsonFeedOptions): Promise<T> {
    const hashedTopic = this.makeFeedTopic(topic)
    const feedType = options?.type ?? DEFAULT_FEED_TYPE

    if (options?.signer && options?.address) {
      return Promise.reject(new BeeError('Both options "signer" and "address" can not be specified at one time!'))
    }

    let address: EthAddress

    if (options?.address) {
      address = makeEthAddress(options?.address)
    } else {
      try {
        address = this.resolveSigner(options?.signer).address
      } catch (e) {
        if (e instanceof BeeError) {
          return Promise.reject(new BeeError('Either address, signer or default signer has to be specified!'))
        } else {
          return Promise.reject(e)
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
   * Creates new postage batch from the funds that the node has available in its Ethereum account.
   *
   * @param amount Amount that represents the value per chunk, has to be greater or equal zero.
   * @param depth Logarithm of the number of chunks that can be stamped with the batch.
   * @param options Options for creation of postage batch
   * @param options.gasPrice Sets gas price for the transaction that creates the postage batch
   * @param options.label Sets label for the postage batch
   * @throws BeeArgumentError when negative amount or depth is specified
   * @throws TypeError if non-integer value is passed to amount or depth
   */
  // eslint-disable-next-line require-await
  async createPostageBatch(amount: bigint, depth: number, options?: PostageBatchOptions): Promise<Address> {
    assertNonNegativeInteger(amount)
    assertNonNegativeInteger(depth)

    if (depth < stamps.MINIMUM_DEPTH) {
      throw new BeeArgumentError(`Depth has to be at least ${stamps.MINIMUM_DEPTH}`, depth)
    }

    if (depth > stamps.MAXIMUM_DEPTH) {
      throw new BeeArgumentError(`Depth has to be at most ${stamps.MAXIMUM_DEPTH}`, depth)
    }

    if (options?.gasPrice) {
      assertNonNegativeInteger(options.gasPrice)
    }

    return stamps.createPostageBatch(this.url, amount, depth, options)
  }

  /**
   * Return details for specific postage batch.
   *
   * @param postageBatchId BatchId
   */
  getPostageBatch(postageBatchId: Address | string): Promise<PostageBatch> {
    assertAddress(postageBatchId)

    return stamps.getPostageBatch(this.url, postageBatchId)
  }

  /**
   * Return all postage batches that has the node available.
   */
  getAllPostageBatch(): Promise<PostageBatch[]> {
    return stamps.getAllPostageBatches(this.url)
  }

  /**
   * Ping the base bee URL. If connection was not successful throw error
   */
  checkConnection(): Promise<void> | never {
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
