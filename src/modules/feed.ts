import { Dictionary, ReferenceResponse } from '../types'
import { safeAxios } from '../utils/safeAxios'

const feedEndpoint = '/feeds'

export type FeedType = 'sequence' | 'epoch'

export interface CreateFeedOptions {
  type?: FeedType
}
export interface FindFeedUpdateOptions {
  index?: number
  at?: number
  type?: FeedType
}
interface FeedUpdateHeaders {
  feedIndex: string
  feedIndexNext: string
}
export interface FindFeedUpdateResponse extends ReferenceResponse, FeedUpdateHeaders {}

/**
 * Create an initial feed root manifest
 *
 * @param url         Bee URL
 * @param owner       Owner's ethereum address in hex
 * @param topic       Topic in hex
 * @param options     Additional options, like type (default: 'sequence')
 */
export async function createFeedManifest(
  url: string,
  owner: string,
  topic: string,
  options?: CreateFeedOptions,
): Promise<ReferenceResponse> {
  const response = await safeAxios<ReferenceResponse>({
    method: 'post',
    url: `${url}${feedEndpoint}/${owner}/${topic}`,
    params: options,
  })

  return response.data
}

function readFeedUpdateHeaders(headers: Dictionary<string>): FeedUpdateHeaders {
  return {
    feedIndex: hexToNumber(headers['swarm-feed-index']),
    feedIndexNext: hexToNumber(headers['swarm-feed-index-next']),
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
 * @param url         Bee URL
 * @param owner       Owner's ethereum address in hex
 * @param topic       Topic in hex
 * @param options     Additional options, like index, at, type
 */
export async function fetchFeedUpdate(
  url: string,
  owner: string,
  topic: string,
  options?: FindFeedUpdateOptions,
): Promise<FindFeedUpdateResponse> {
  const response = await safeAxios<ReferenceResponse>({
    url: `${url}${feedEndpoint}/${owner}/${topic}`,
    params: options,
  })
  const findFeedUpdateResponse = {
    ...response.data,
    ...readFeedUpdateHeaders(response.headers),
  }

  return findFeedUpdateResponse
}
