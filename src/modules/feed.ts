import { Index } from '../feed'
import { FeedType } from '../feed/type'
import { BatchId, BeeRequestOptions, Data, Reference, ReferenceResponse, Topic } from '../types'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { BeeError } from '../utils/error'
import { HexEthAddress } from '../utils/eth'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'

const feedEndpoint = 'feeds'

export interface CreateFeedOptions {
  type?: FeedType
}

export interface FeedUpdateOptions {
  /**
   * Specifies the start date as unix time stamp
   */
  at?: number

  type?: FeedType

  /**
   * Fetch specific previous Feed's update (default fetches latest update)
   */
  index?: Index
}

interface FeedUpdateHeaders {
  /**
   * The current feed's index
   */
  feedIndex: Index

  /**
   * The feed's index for next update.
   * Only set for the latest update. If update is fetched using previous index, then this is an empty string.
   */
  feedIndexNext: string
}
export interface FetchFeedUpdateResponse extends FeedUpdateHeaders {
  /**
   * Feed payload
   */
  data: Data
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
  owner: HexEthAddress,
  topic: Topic,
  postageBatchId: BatchId,
): Promise<Reference> {
  const response = await http<ReferenceResponse>(requestOptions, {
    method: 'post',
    responseType: 'json',
    url: `${feedEndpoint}/${owner}/${topic}`,
    headers: extractUploadHeaders(postageBatchId),
  })

  return response.data.reference
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
    feedIndex,
    feedIndexNext,
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
 * @param owner          Owner's ethereum address in hex
 * @param topic          Topic in hex
 * @param options        Additional options, like index, at, type
 */
export async function fetchLatestFeedUpdate(
  requestOptions: BeeRequestOptions,
  owner: HexEthAddress,
  topic: Topic,
  options?: FeedUpdateOptions,
): Promise<FetchFeedUpdateResponse> {
  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${feedEndpoint}/${owner}/${topic}`,
    params: options as any,
  })

  return {
    data: wrapBytesWithHelpers(new Uint8Array(response.data)),
    ...readFeedUpdateHeaders(response.headers as Record<string, string>),
  }
}
