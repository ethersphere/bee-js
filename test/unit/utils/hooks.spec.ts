import { assertAllIsDone, downloadDataMock, fetchFeedUpdateMock, MOCK_SERVER_URL, uploadFileMock } from '../nock'
import { testBatchId, testChunkHash, testIdentity, testJsonHash } from '../../utils'
import { Bee, ReferenceResponse } from '../../../src'
import * as hooks from '../../../src/utils/hooks'

describe('hooks', () => {
  it('should call with request', async () => {
    const bee = new Bee(MOCK_SERVER_URL)

    const topic = bee.makeFeedTopic('some-topic')
    fetchFeedUpdateMock(testIdentity.address, topic).reply(200, {
      reference: testJsonHash,
    } as ReferenceResponse)

    const requestSpy = jest.fn()
    const responseSpy = jest.fn()
    hooks.onRequest(requestSpy)
    hooks.onResponse(responseSpy)

    const feedReader = await bee.makeFeedReader('sequence', topic, testIdentity.address)
    const feedUpdate = await feedReader.download()

    expect(feedUpdate.reference).toEqual(testJsonHash)

    expect(requestSpy.mock.calls.length).toEqual(1)
    expect(requestSpy.mock.calls[0].length).toEqual(1)
    expect(requestSpy.mock.calls[0][0]).toEqual({
      url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}`,
      method: 'get',
      params: { type: 'sequence' },
      headers: { Accept: 'application/json, text/plain, */*' },
    })

    expect(responseSpy.mock.calls.length).toEqual(1)
    expect(responseSpy.mock.calls[0].length).toEqual(1)
    expect(responseSpy.mock.calls[0][0]).toEqual({
      status: 200,
      statusText: null,
      headers: {
        'content-type': 'application/json',
      },
      data: {
        reference: testJsonHash,
      },
      request: {
        url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}`,
        method: 'get',
        data: undefined,
        params: { type: 'sequence' },
        headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.21.1' },
      },
    })

    assertAllIsDone()
  })

  it('should clear when requested', async () => {
    const bee = new Bee(MOCK_SERVER_URL)

    const topic = bee.makeFeedTopic('some-topic')
    fetchFeedUpdateMock(testIdentity.address, topic).reply(200, {
      reference: testJsonHash,
    } as ReferenceResponse)
    downloadDataMock(testChunkHash).reply(200, 'hello-world')

    const requestSpy = jest.fn()
    const responseSpy = jest.fn()
    const requestId = hooks.onRequest(requestSpy)
    const responseId = hooks.onResponse(responseSpy)

    const feedReader = await bee.makeFeedReader('sequence', topic, testIdentity.address)
    const feedUpdate = await feedReader.download()

    expect(feedUpdate.reference).toEqual(testJsonHash)

    expect(requestSpy.mock.calls.length).toEqual(1)
    expect(requestSpy.mock.calls[0].length).toEqual(1)
    expect(requestSpy.mock.calls[0][0]).toEqual({
      url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}`,
      method: 'get',
      params: { type: 'sequence' },
      headers: { Accept: 'application/json, text/plain, */*' },
    })

    expect(responseSpy.mock.calls.length).toEqual(1)
    expect(responseSpy.mock.calls[0].length).toEqual(1)
    expect(responseSpy.mock.calls[0][0]).toEqual({
      status: 200,
      statusText: null,
      headers: {
        'content-type': 'application/json',
      },
      data: {
        reference: testJsonHash,
      },
      request: {
        url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}`,
        method: 'get',
        data: undefined,
        params: { type: 'sequence' },
        headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.21.1' },
      },
    })

    // Removing the hooks
    hooks.clearOnRequest(requestId)
    hooks.clearOnResponse(responseId)
    expect((await bee.downloadData(testChunkHash)).text()).toEqual('hello-world')

    // Asserting that the spy did not changed from last request
    expect(requestSpy.mock.calls.length).toEqual(1)
    expect(requestSpy.mock.calls[0].length).toEqual(1)
    expect(responseSpy.mock.calls.length).toEqual(1)
    expect(responseSpy.mock.calls[0].length).toEqual(1)

    assertAllIsDone()
  })

  it('should call with request with correct headers', async () => {
    const bee = new Bee(MOCK_SERVER_URL)

    uploadFileMock(testBatchId, 'nice.txt', { encrypt: true }).reply(200, {
      reference: testJsonHash,
    } as ReferenceResponse)

    const requestSpy = jest.fn()
    const responseSpy = jest.fn()
    hooks.onRequest(requestSpy)
    hooks.onResponse(responseSpy)

    const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt', { encrypt: true })

    expect(reference).toEqual(testJsonHash)

    expect(requestSpy.mock.calls.length).toEqual(1)
    expect(requestSpy.mock.calls[0].length).toEqual(1)
    expect(requestSpy.mock.calls[0][0]).toEqual({
      url: `${MOCK_SERVER_URL}bzz`,
      method: 'post',
      data: new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]),
      params: { name: 'nice.txt' },
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'swarm-encrypt': 'true',
        'swarm-postage-batch-id': testBatchId,
      },
    })

    expect(responseSpy.mock.calls.length).toEqual(1)
    expect(responseSpy.mock.calls[0].length).toEqual(1)
    expect(responseSpy.mock.calls[0][0]).toEqual({
      status: 200,
      statusText: null,
      headers: {
        'content-type': 'application/json',
      },
      data: {
        reference: testJsonHash,
      },
      request: {
        url: `${MOCK_SERVER_URL}bzz`,
        method: 'post',
        data: new ArrayBuffer(0),
        params: { name: 'nice.txt' },
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'axios/0.21.1',
          'Content-Length': 11,
          'swarm-encrypt': 'true',
          'swarm-postage-batch-id': testBatchId,
        },
      },
    })

    assertAllIsDone()
  })
})
