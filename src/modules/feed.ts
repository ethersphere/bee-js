import { BatchId, Ky, Reference, ReferenceResponse, Topic } from '../types'
import { filterHeaders, http } from '../utils/http'
import { FeedType } from '../feed/type'
import { HexEthAddress } from '../utils/eth'
import { extractUploadHeaders } from '../utils/headers'
import { BeeError } from '../utils/error'

const feedEndpoint = 'feeds'

export interface CreateFeedOptions {
  type?: FeedType
}

export interface FeedUpdateOptions {
  /**
   * Specifies the start date as unix time stamp
   */
  at?: number

  /**
   * Can be 'epoch' or 'sequence' (default: 'sequence')
   */
  type?: FeedType

  /**
   * Fetch specific previous Feed's update (default fetches latest update)
   */
  index?: string
}

interface FeedUpdateHeaders {
  /**
   * The current feed's index
   */
  feedIndex: string

  /**
   * The feed's index for next update.
   * Only set for the latest update. If update is fetched using previous index, then this is an empty string.
   */
  feedIndexNext: string
}
export interface FetchFeedUpdateResponse extends ReferenceResponse, FeedUpdateHeaders {}

/**
 * Create an initial feed root manifest
 *
 * @param ky Ky instance
 * @param owner           Owner's ethereum address in hex
 * @param topic           Topic in hex
 * @param postageBatchId  Postage BatchId to be used to create the Feed Manifest
 * @param options         Additional options, like type (default: 'sequence')
 */
export async function createFeedManifest(
  ky: Ky,
  owner: HexEthAddress,
  topic: Topic,
  postageBatchId: BatchId,
  options?: CreateFeedOptions,
): Promise<Reference> {
  const response = await http<ReferenceResponse>(ky, {
    method: 'post',
    responseType: 'json',
    path: `${feedEndpoint}/${owner}/${topic}`,
    searchParams: filterHeaders(options),
    headers: extractUploadHeaders(postageBatchId),
  })

  return response.parsedData.reference
}

function readFeedUpdateHeaders(headers: Headers): FeedUpdateHeaders {
  const feedIndex = headers.get('swarm-feed-index')
  const feedIndexNext = headers.get('swarm-feed-index-next')

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
 * @param ky Ky instance
 * @param owner       Owner's ethereum address in hex
 * @param topic       Topic in hex
 * @param options     Additional options, like index, at, type
 */
export async function fetchLatestFeedUpdate(
  ky: Ky,
  owner: HexEthAddress,
  topic: Topic,
  options?: FeedUpdateOptions,
): Promise<FetchFeedUpdateResponse> {
  const response = await http<ReferenceResponse>(ky, {
    responseType: 'json',
    path: `${feedEndpoint}/${owner}/${topic}`,
    searchParams: filterHeaders(options),
  })

  return {
    ...response.parsedData,
    ...readFeedUpdateHeaders(response.headers),
  }
}
