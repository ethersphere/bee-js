import nock from 'nock'
import { HexEthAddress } from '../../src/utils/eth'
import { Reference } from '../../src/types'
import { DEFAULT_FEED_TYPE, FeedType } from '../../src/feed/type'

export const MOCK_SERVER_URL = 'http://localhost:12345/'

// Endpoints
const feedEndpoint = '/feeds'
const bytesEndpoint = '/bytes'

export function assertAllIsDone(): void {
  if (!nock.isDone()) {
    throw new Error('Some expected request was not performed!')
  }
}

export function fetchFeedUpdateMock(
  address: HexEthAddress | string,
  hashedTopic: string,
  type: FeedType = DEFAULT_FEED_TYPE,
): nock.Interceptor {
  return nock(MOCK_SERVER_URL).get(`${feedEndpoint}/${address}/${hashedTopic}?type=${type}`)
}

export function downloadDataMock(reference: Reference | string): nock.Interceptor {
  return nock(MOCK_SERVER_URL).get(`${bytesEndpoint}/${reference}`)
}
