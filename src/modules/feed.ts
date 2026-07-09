import { Objects } from 'cafe-utility'
import { makeFeedReader, makeFeedWriter } from '../feed'
import { areAllSequentialFeedsUpdateRetrievable } from '../feed/retrievable'
import type { BeeRequestOptions, DownloadOptions, FeedReader, FeedWriter } from '../types'
import { UploadOptions } from '../types'
import { UploadResultBody } from '../types/schema/upload'
import { Bytes } from '../utils/bytes'
import { BeeError } from '../utils/error'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { DownloadOptionsSchema, UploadOptionsSchema } from '../utils/schema'
import { BatchId, EthAddress, FeedIndex, PrivateKey, Reference, Topic } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const feedEndpoint = 'feeds'

export interface FeedUpdateOptions {
  /**
   * Specifies the start date as unix time stamp
   */
  at?: number

  /**
   * Fetch specific previous Feed's update (default fetches latest update)
   */
  index?: FeedIndex | number

  /**
   * Whether the first 8 bytes of the payload are a timestamp
   */
  hasTimestamp?: boolean
}

interface FeedUpdateHeaders {
  /**
   * The current feed's index
   */
  feedIndex: FeedIndex

  /**
   * The feed's index for next update.
   * Only set for the latest update. If update is fetched using previous index, then this is an empty string.
   */
  feedIndexNext?: FeedIndex
}

export interface FeedPayloadResult extends FeedUpdateHeaders {
  payload: Bytes
}

export interface FeedReferenceResult extends FeedUpdateHeaders {
  reference: Reference
}

/**
 * Create an initial feed root manifest
 *
 * @param requestOptions  Options for making requests
 * @param owner           Owner's ethereum address in hex
 * @param topic           Topic in hex
 * @param postageBatchId  Postage BatchId to be used to create the Feed Manifest
 * @param options         Additional options, like type (default: 'sequence')
 */
export async function createFeedManifest(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
  stamp: BatchId | Uint8Array | string,
  options?: UploadOptions,
): Promise<Reference> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${feedEndpoint}/${owner}/${topic}`,
    headers: prepareRequestHeaders(stamp, options),
  })

  return UploadResultBody.parse(response.data).reference
}

function readFeedUpdateHeaders(headers: Record<string, string>): FeedUpdateHeaders {
  const feedIndex = headers['swarm-feed-index']
  const feedIndexNext = headers['swarm-feed-index-next']

  if (!feedIndex) {
    throw new BeeError('Response did not contain expected swarm-feed-index!')
  }

  if (!feedIndexNext) {
    throw new BeeError('Response did not contain expected swarm-feed-index-next!')
  }

  return {
    feedIndex: new FeedIndex(feedIndex),
    feedIndexNext: new FeedIndex(feedIndexNext),
  }
}

/**
 * Find and retrieve feed update
 *
 * The feed consists of updates. This endpoint looks up an
 * update that matches the provided parameters and returns
 * the reference it contains along with its index and the
 * index of the subsequent update.
 *
 * @param requestOptions Options for making requests
 * @param owner          Owner's ethereum address
 * @param topic          Topic
 * @param options        Additional options, like index, at, type
 */
export async function fetchLatestFeedUpdate(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
  options?: FeedUpdateOptions,
): Promise<FeedPayloadResult> {
  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${feedEndpoint}/${owner}/${topic}`,
    params: { ...options },
  })

  return {
    payload: new Bytes(response.data),
    ...readFeedUpdateHeaders(response.headers as Record<string, string>),
  }
}

export async function probeFeed(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
): Promise<FeedUpdateHeaders> {
  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${feedEndpoint}/${owner}/${topic}`,
    params: {
      'Swarm-Only-Root-Chunk': true,
    },
  })

  return readFeedUpdateHeaders(response.headers as Record<string, string>)
}

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
