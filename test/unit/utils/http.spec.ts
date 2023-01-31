import { MOCK_SERVER_URL } from '../nock'
import { http } from '../../../src/utils/http'
import nock from 'nock'
import { BeeNotAJsonError, BeeResponseError } from '../../../src'
import { expect } from 'chai'
import { expect as jestExpect } from 'expect'

class ShouldHaveFailedError extends Error {}

describe('http', () => {
  it('should handle non-json response for 200', async function () {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(200, HTML_RESPONSE)
    const kyOptions = { prefixUrl: MOCK_SERVER_URL }

    await expect(http(kyOptions, { path: 'endpoint', responseType: 'json', method: 'get' })).rejectedWith(
      BeeNotAJsonError,
    )
  })

  it('should handle non-json response for 404', async function () {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(404, HTML_RESPONSE)
    const kyOptions = { prefixUrl: MOCK_SERVER_URL }

    await expect(http(kyOptions, { path: 'endpoint', responseType: 'json', method: 'get' })).rejectedWith(
      BeeResponseError,
    )
  })

  it('should give options when thrown error', async function () {
    nock(MOCK_SERVER_URL).get('/endpoint').reply(400, 'Some error')
    const kyOptions = { prefixUrl: MOCK_SERVER_URL }

    try {
      await http(kyOptions, { path: 'endpoint', method: 'get' })
      throw new ShouldHaveFailedError()
    } catch (e) {
      if (e instanceof ShouldHaveFailedError) {
        throw e
      }

      if (!(e instanceof BeeResponseError)) {
        throw new Error('Expected error to be instance of BeeResponseError!')
      }

      expect(e.requestOptions).to.eql({ path: 'endpoint', method: 'get' })

      // Testing only partial Response object for the major functionality
      jestExpect(e.response).toEqual(
        jestExpect.objectContaining({
          text: jestExpect.any(Function),
          json: jestExpect.any(Function),
          url: jestExpect.any(String),
          status: jestExpect.any(Number),
        }),
      )

      expect(e.responseBody).to.eql('Some error')
    }
  })
})
