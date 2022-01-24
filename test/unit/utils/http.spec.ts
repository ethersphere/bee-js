import { MOCK_SERVER_URL } from '../nock'
import { http } from '../../../src/utils/http'
import nock from 'nock'
import ky from 'ky-universal'
import { BeeNotAJsonError, BeeResponseError } from '../../../src'

class ShouldHaveFailedError extends Error {}

describe('http', () => {
  it('should handle non-json response for 200', async () => {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(200, HTML_RESPONSE)
    const kyInst = ky.create({ prefixUrl: MOCK_SERVER_URL })

    await expect(http(kyInst, { path: 'endpoint', responseType: 'json', method: 'get' })).rejects.toThrow(
      BeeNotAJsonError,
    )
  })

  it('should handle non-json response for 404', async () => {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(404, HTML_RESPONSE)
    const kyInst = ky.create({ prefixUrl: MOCK_SERVER_URL })

    await expect(http(kyInst, { path: 'endpoint', responseType: 'json', method: 'get' })).rejects.toThrow(
      BeeResponseError,
    )
  })

  it('should give options when thrown error', async () => {
    nock(MOCK_SERVER_URL).get('/endpoint').reply(400, 'Some error')
    const kyInst = ky.create({ prefixUrl: MOCK_SERVER_URL })

    try {
      await http(kyInst, { path: 'endpoint', method: 'get' })
      throw new ShouldHaveFailedError()
    } catch (e) {
      if (e instanceof ShouldHaveFailedError) {
        throw e
      }

      if (!(e instanceof BeeResponseError)) {
        throw new Error('Expected error to be instance of BeeResponseError!')
      }

      expect(e.requestOptions).toEqual({ path: 'endpoint', method: 'get' })

      // Testing only partial Response object for the major functionality
      expect(e.response).toEqual(
        expect.objectContaining({
          text: expect.any(Function),
          json: expect.any(Function),
          url: expect.any(String),
          status: expect.any(Number),
        }),
      )

      expect(e.responseBody).toEqual('Some error')
    }
  })
})
