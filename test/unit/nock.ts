import nock from 'nock'
import { HexEthAddress } from '../../src/utils/eth'
import { Reference } from '../../src/types'
import { DEFAULT_FEED_TYPE, FeedType } from '../../src/feed/type'

export const MOCK_SERVER_URL = 'http://localhost:12345/'

// Endpoints
const FEED_ENDPOINT = '/feeds'
const BYTES_ENDPOINT = '/bytes'
const POSTAGE_ENDPOINT = '/stamps'

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
  return nock(MOCK_SERVER_URL).get(`${FEED_ENDPOINT}/${address}/${hashedTopic}?type=${type}`)
}

export function downloadDataMock(reference: Reference | string): nock.Interceptor {
  return nock(MOCK_SERVER_URL).get(`${BYTES_ENDPOINT}/${reference}`)
}

export function createPostageBatchMock(
  amount: string,
  depth: string,
  gasPrice?: string,
  label?: string,
): nock.Interceptor {
  let nockScope: nock.Scope

  if (gasPrice) {
    nockScope = nock(MOCK_SERVER_URL, {
      reqheaders: {
        'gas-price': gasPrice,
      },
    })
  } else {
    nockScope = nock(MOCK_SERVER_URL)
  }

  const nockMock = nockScope.post(`${POSTAGE_ENDPOINT}/${amount}/${depth}`)

  if (label) {
    return nockMock.query({ label })
  } else {
    return nockMock
  }
}
