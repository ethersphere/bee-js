import { Objects } from 'cafe-utility'
import { createFeedManifest, fetchLatestFeedUpdate } from '../api/feed'
import type { FeedPayloadResult } from '../api/feed'
import { makeFeedReader, makeFeedWriter } from '../feed'
import { areAllSequentialFeedsUpdateRetrievable } from '../feed/retrievable'
import type { BeeRequestOptions, DownloadOptions, FeedReader, FeedWriter } from '../types'
import { UploadOptions } from '../types'
import { DownloadOptionsSchema, UploadOptionsSchema } from '../utils/schema'
import { BatchId, EthAddress, FeedIndex, PrivateKey, Reference, Topic } from '../utils/typed-bytes'
import type { BeeContext } from './context'

/**
 * Feed operations.
 *
 * Accessed as `bee.feed`. Delegates to the feed subsystem (`src/feed`).
 */
export class Feed {
  constructor(private readonly context: BeeContext) {}

  /**
   * Makes a new feed reader for downloading feed updates.
   *
   * @param topic Topic in hex or bytes
   * @param owner Owner's ethereum address in hex or bytes
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  makeReader(
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): FeedReader {
    return makeFeedReader(
      this.context.getRequestOptionsForCall(requestOptions),
      new Topic(topic),
      new EthAddress(owner),
    )
  }

  /**
   * Makes a new feed writer for updating feeds.
   *
   * @param topic Topic in hex or bytes
   * @param signer The signer's private key. Falls back to the Bee instance signer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  makeWriter(
    topic: Topic | Uint8Array | string,
    signer?: PrivateKey | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): FeedWriter {
    const key = signer ? new PrivateKey(signer) : this.context.signer

    if (!key) {
      throw Error('No signer provided')
    }

    return makeFeedWriter(this.context.getRequestOptionsForCall(requestOptions), new Topic(topic), key)
  }

  /**
   * Creates a feed manifest chunk and returns the reference to it.
   *
   * @param postageBatchId Postage BatchId to be used to create the Feed Manifest
   * @param topic Topic in hex or bytes
   * @param owner Owner's ethereum address in hex or bytes
   * @param options Options that affect the request behavior
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async createManifest(
    postageBatchId: BatchId | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Reference> {
    const batchId = new BatchId(postageBatchId)
    const feedTopic = new Topic(topic)
    const feedOwner = new EthAddress(owner)

    if (options) {
      options = UploadOptionsSchema.parse(options)
    }

    return createFeedManifest(
      this.context.getRequestOptionsForCall(requestOptions),
      feedOwner,
      feedTopic,
      batchId,
      options,
    )
  }

  /**
   * Fetches the latest feed update.
   *
   * @param topic Topic in hex or bytes
   * @param owner Owner's ethereum address in hex or bytes
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async fetchLatestUpdate(
    topic: Topic | Uint8Array | string,
    owner: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<FeedPayloadResult> {
    return fetchLatestFeedUpdate(
      this.context.getRequestOptionsForCall(requestOptions),
      new EthAddress(owner),
      new Topic(topic),
    )
  }

  /**
   * Validates whether a feed is retrievable in the network.
   *
   * @param owner Owner's ethereum address in hex or bytes
   * @param topic Topic in hex or bytes
   * @param index Optional feed index
   * @param options Download options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async isRetrievable(
    owner: EthAddress | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    index?: FeedIndex,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<boolean> {
    const feedOwner = new EthAddress(owner)
    const feedTopic = new Topic(topic)

    if (options) {
      options = DownloadOptionsSchema.parse(options)
    }

    if (!index) {
      try {
        await this.makeReader(feedTopic, feedOwner, requestOptions).download()

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
      this.context.bee,
      feedOwner,
      feedTopic,
      index,
      options,
      this.context.getRequestOptionsForCall(requestOptions),
    )
  }
}
