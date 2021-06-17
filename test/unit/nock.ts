import nock, { RequestHeaderMatcher } from 'nock'
import { DEFAULT_FEED_TYPE, FeedType } from '../../src/feed/type'
import { Reference } from '../../src/types'
import { HexEthAddress } from '../../src/utils/eth'

export const MOCK_SERVER_URL = 'http://localhost:12345/'

// Endpoints
const FEED_ENDPOINT = '/feeds'
const BYTES_ENDPOINT = '/bytes'
const POSTAGE_ENDPOINT = '/stamps'
const CHEQUEBOOK_ENDPOINT = '/chequebook'

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
  immutableFlag?: string,
): nock.Interceptor {
  let nockScope: nock.Scope

  const reqheaders: Record<string, RequestHeaderMatcher> = {}

  if (immutableFlag) {
    reqheaders.immutable = immutableFlag
  }

  if (gasPrice) {
    reqheaders['gas-price'] = gasPrice
  }

  if (immutableFlag || gasPrice) {
    nockScope = nock(MOCK_SERVER_URL, {
      reqheaders,
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

export function cashoutLastChequeMock(peer: string, gasPrice?: string, gasLimit?: string): nock.Interceptor {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  if (gasLimit) {
    headers['gas-limit'] = gasLimit
  }

  return nock(MOCK_SERVER_URL, {
    reqheaders: headers,
  }).post(`${CHEQUEBOOK_ENDPOINT}/cashout/${peer}`)
}

export function depositTokensMock(amount: string, gasPrice?: string): nock.Interceptor {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  return nock(MOCK_SERVER_URL, {
    reqheaders: headers,
  }).post(`${CHEQUEBOOK_ENDPOINT}/deposit?amount=${amount}`)
}

export function withdrawTokensMock(amount: string, gasPrice?: string): nock.Interceptor {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  return nock(MOCK_SERVER_URL, {
    reqheaders: headers,
  }).post(`${CHEQUEBOOK_ENDPOINT}/withdraw?amount=${amount}`)
}
