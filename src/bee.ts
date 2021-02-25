import type { Readable } from 'stream'
import * as file from './modules/file'
import * as collection from './modules/collection'
import * as tag from './modules/tag'
import * as pinning from './modules/pinning'
import * as bytes from './modules/bytes'
import * as pss from './modules/pss'
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
} from './types'
import { BeeError } from './utils/error'
import { prepareWebsocketData } from './utils/data'
import { fileArrayBuffer, isFile } from './utils/file'
import { AxiosRequestConfig } from 'axios'
import { FeedReader, FeedWriter, makeFeedReader, makeFeedWriter } from './feed'
import { EthAddress, makeSigner } from './chunk/signer'
import { assertIsFeedType, FeedType } from './feed/type'
import { Signer } from './chunk/signer'
import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData, SOCReader, SOCWriter } from './chunk/soc'
import { makeOwner, OwnerInput } from './chunk/owner'
import { Topic, makeTopic, makeTopicFromString } from './feed/topic'
import { createFeedManifest } from './modules/feed'
import { bytesToHex } from './utils/hex'

/**
 * The Bee class provides a way of interacting with the Bee APIs based on the provided url
 *
 * @param url URL of a running Bee node
 */
export class Bee {
  constructor(readonly url: string) {}

  /**
   * Upload data to a Bee node
   *
   * @param data    Data to be uploaded
   * @param options Aditional options like tag, encryption, pinning, content-type
   *
   * @returns reference is a content hash of the data
   */
  uploadData(data: string | Uint8Array, options?: UploadOptions): Promise<Reference> {
    return bytes.upload(this.url, data, options)
  }

  /**
   * Download data as a byte array
   *
   * @param reference Bee data reference
   */
  downloadData(reference: Reference): Promise<Uint8Array> {
    return bytes.download(this.url, reference)
  }

  /**
   * Download data as a readable stream
   *
   * @param reference Bee data reference
   * @param axiosOptions optional - alter default options of axios HTTP client
   */
  downloadReadableData(reference: Reference, axiosOptions?: AxiosRequestConfig): Promise<Readable> {
    return bytes.downloadReadable(this.url, reference, axiosOptions)
  }

  /**
   * Upload single file to a Bee node
   *
   * @param data    Data or file to be uploaded
   * @param name    Name of the uploaded file (optional)
   * @param options Aditional options like tag, encryption, pinning, content-type
   *
   * @returns reference is a content hash of the file
   */
  async uploadFile(
    data: string | Uint8Array | Readable | File,
    name?: string,
    options?: FileUploadOptions,
  ): Promise<Reference> {
    if (isFile(data)) {
      const fileData = await fileArrayBuffer(data)
      const fileName = name || data.name
      const contentType = data.type
      const fileOptions = options !== undefined ? { contentType, ...options } : { contentType }

      return file.upload(this.url, fileData, fileName, fileOptions)
    } else {
      return file.upload(this.url, data, name, options)
    }
  }

  /**
   * Download single file as a byte array
   *
   * @param reference Bee file reference
   */
  downloadFile(reference: Reference): Promise<FileData<Uint8Array>> {
    return file.download(this.url, reference)
  }

  /**
   * Download single file as a readable stream
   *
   * @param reference Bee file reference
   */
  downloadReadableFile(reference: Reference): Promise<FileData<Readable>> {
    return file.downloadReadable(this.url, reference)
  }

  /**
   * Upload collection of files to a Bee node
   *
   * Uses the FileList API from the browser.
   *
   * @param fileList list of files to be uploaded
   * @param options Additional options like tag, encryption, pinning
   *
   * @returns reference of the collection of files
   */
  async uploadFiles(fileList: FileList | File[], options?: CollectionUploadOptions): Promise<Reference> {
    const data = await collection.buildFileListCollection(fileList)

    return collection.upload(this.url, data, options)
  }

  /**
   * Upload collection of files to a Bee node
   *
   * Uses the `fs` module of Node.js
   *
   * @param dir the path of the files to be uploaded
   * @param recursive specifies if the directory should be recursively uploaded
   * @param options Additional options like tag, encryption, pinning
   *
   * @returns reference of the collection of files
   */
  async uploadFilesFromDirectory(dir: string, recursive = true, options?: CollectionUploadOptions): Promise<Reference> {
    const data = await collection.buildCollection(dir, recursive)

    return collection.upload(this.url, data, options)
  }

  /**
   * Download single file as a byte array from collection given using the path
   *
   * @param reference Bee collection reference
   * @param path Path of the requested file in the collection
   *
   * @returns file in byte array with metadata
   */
  downloadFileFromCollection(reference: Reference, path = ''): Promise<FileData<Uint8Array>> {
    return collection.download(this.url, reference, path)
  }

  /**
   * Download single file as a readable stream from collection given using the path
   *
   * @param reference Bee collection reference
   * @param path Path of the requested file in the collection
   * @param axiosOptions optional - alter default options of axios HTTP client
   *
   * @returns file in readable stream with metadata
   */
  downloadReadableFileFromCollection(
    reference: Reference,
    path = '',
    axiosOptions?: AxiosRequestConfig,
  ): Promise<FileData<Readable>> {
    return collection.downloadReadable(this.url, reference, path, axiosOptions)
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
   * @param tag UID or tag object to be retrieved
   */
  retrieveTag(tagUid: number | Tag): Promise<Tag> {
    return tag.retrieveTag(this.url, tagUid)
  }

  /**
   * Pin file with given reference
   *
   * @param reference Bee file reference
   */
  pinFile(reference: Reference): Promise<BeeResponse> {
    return pinning.pinFile(this.url, reference)
  }

  /**
   * Unpin file with given reference
   *
   * @param reference Bee file reference
   */
  unpinFile(reference: Reference): Promise<BeeResponse> {
    return pinning.unpinFile(this.url, reference)
  }

  /**
   * Pin collection with given reference
   *
   * @param reference Bee collection reference
   */
  pinCollection(reference: Reference): Promise<BeeResponse> {
    return pinning.pinCollection(this.url, reference)
  }

  /**
   * Unpin collection with given reference
   *
   * @param reference Bee collection reference
   */
  unpinCollection(reference: Reference): Promise<BeeResponse> {
    return pinning.unpinCollection(this.url, reference)
  }

  /**
   * Pin data with given reference
   *
   * @param reference Bee data reference
   */
  pinData(reference: Reference): Promise<BeeResponse> {
    return pinning.pinData(this.url, reference)
  }

  /**
   * Unpin data with given reference
   *
   * @param reference Bee data reference
   */
  unpinData(reference: Reference): Promise<BeeResponse> {
    return pinning.unpinData(this.url, reference)
  }

  /**
   * Send to recipient or target with Postal Service for Swarm
   *
   * @param topic Topic name
   * @param target Target message address prefix
   * @param data Message to be sent
   * @param recipient Recipient public key
   *
   */
  pssSend(
    topic: string,
    target: AddressPrefix,
    data: string | Uint8Array,
    recipient?: PublicKey,
  ): Promise<BeeResponse> {
    return pss.send(this.url, topic, target, data, recipient)
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
        ws.terminate()
      }
    }

    const subscription = {
      topic,
      cancel,
    }

    ws.onmessage = ev => {
      const data = prepareWebsocketData(ev.data)

      // ignore empty messages
      if (data.length > 0) {
        handler.onMessage(data, subscription)
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
  pssReceive(topic: string, timeoutMsec = 0): Promise<Uint8Array> {
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
   * @param type    The type of the feed, can be 'epoch' or 'sequence'
   * @param topic   Topic in hex or bytes
   * @param owner   Owner's ethereum address in hex or bytes
   */
  createFeedManifest(
    type: FeedType,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
  ): Promise<Reference> {
    assertIsFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeOwner(owner)

    return createFeedManifest(this.url, bytesToHex(canonicalOwner), bytesToHex(canonicalTopic), { type })
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
    assertIsFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalOwner = makeOwner(owner)

    return makeFeedReader(this.url, type, canonicalTopic, canonicalOwner)
  }

  /**
   * Make a new feed writer for updating feeds
   *
   * @param type    The type of the feed, can be 'epoch' or 'sequence'
   * @param topic   Topic in hex or bytes
   * @param signer  The signer's private key or a Signer instance that can sign data
   */
  makeFeedWriter(type: FeedType, topic: Topic | Uint8Array | string, signer: Signer | Uint8Array | string): FeedWriter {
    assertIsFeedType(type)

    const canonicalTopic = makeTopic(topic)
    const canonicalSigner = makeSigner(signer)

    return makeFeedWriter(this.url, type, canonicalTopic, canonicalSigner)
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
  makeSOCReader(ownerAddress: OwnerInput): SOCReader {
    const canonicalOwner = makeOwner(ownerAddress)

    return {
      download: downloadSingleOwnerChunk.bind(null, this.url, canonicalOwner),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks
   *
   * @param signer The signer's private key or a Signer instance that can sign data
   */
  makeSOCWriter(signer: Signer | Uint8Array | string): SOCWriter {
    const canonicalSigner = makeSigner(signer)

    return {
      ...this.makeSOCReader(canonicalSigner.address),

      upload: uploadSingleOwnerChunkData.bind(null, this.url, canonicalSigner),
    }
  }
}
