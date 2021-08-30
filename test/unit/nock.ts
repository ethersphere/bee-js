import nock, { RequestHeaderMatcher } from 'nock'
import { DEFAULT_FEED_TYPE, FeedType } from '../../src/feed/type'
import { Reference } from '../../src/types'
import { HexEthAddress } from '../../src/utils/eth'

export const MOCK_SERVER_URL = 'http://localhost:12345/'

// Endpoints
const FEED_ENDPOINT = '/feeds'
const BZZ_ENDPOINT = '/bzz'
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
  return nock(MOCK_SERVER_URL)
    .defaultReplyHeaders({
      'swarm-feed-index': '1',
      'swarm-feed-index-next': '2',
    })
    .get(`${FEED_ENDPOINT}/${address}/${hashedTopic}?type=${type}`)
}

export function downloadDataMock(reference: Reference | string): nock.Interceptor {
  return nock(MOCK_SERVER_URL).get(`${BYTES_ENDPOINT}/${reference}`)
}

interface UploadOptions {
  name?: string
  tag?: number
  pin?: boolean
  encrypt?: boolean
  collection?: boolean
  indexDocument?: string
  errorDocument?: string
}

function camelCaseToDashCase(str: string) {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

export function uploadFileMock(
  batchId: string,
  name?: string,
  options?: UploadOptions,
  extraHeaders?: Record<string, string>,
): nock.Interceptor {
  // Prefixes the options with `swarm-` so the object can be used for required headers
  const headers = Object.entries(options || {}).reduce<Record<string, string>>((prev, curr) => {
    prev[`swarm-${camelCaseToDashCase(curr[0])}`] = curr[1]

    return prev
  }, {})

  return nock(MOCK_SERVER_URL, { reqheaders: { 'swarm-postage-batch-id': batchId, ...headers, ...extraHeaders } })
    .post(`${BZZ_ENDPOINT}`)
    .query({ name })
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

export function depositTokensMock(
  amount: string,
  gasPrice?: string,
  extraHeaders?: Record<string, string>,
): nock.Interceptor {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice
  }

  return nock(MOCK_SERVER_URL, {
    reqheaders: { ...headers, ...extraHeaders },
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
