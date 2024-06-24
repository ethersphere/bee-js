import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
import nock from 'nock'
import { http } from '../../../src/utils/http'
import { MOCK_SERVER_URL } from '../nock'

class ShouldHaveFailedError extends Error {}

describe('http', () => {
  it('should handle json with data for array', async function () {
    const JSON_RESPONSE = `[1,2,5]`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(200, JSON_RESPONSE)
    const kyOptions = { baseURL: MOCK_SERVER_URL }
    const response = await http(kyOptions, { url: 'endpoint', responseType: 'json', method: 'get' })  
    await expect(response.data).to.eql(JSON.parse(JSON_RESPONSE))
  })

  it('should handle non-json response for 200', async function () {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(200, HTML_RESPONSE)
    const kyOptions = { baseURL: MOCK_SERVER_URL }

    await expect(http(kyOptions, { url: 'endpoint', responseType: 'json', method: 'get' })).rejectedWith(Error)
  })

  it('should handle non-json response for 404', async function () {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(404, HTML_RESPONSE)
    const kyOptions = { baseURL: MOCK_SERVER_URL }

    await expect(http(kyOptions, { url: 'endpoint', responseType: 'json', method: 'get' })).rejectedWith(Error)
  })

  it('should give options when thrown error', async function () {
    nock(MOCK_SERVER_URL).get('/endpoint').reply(400, 'Some error')
    const kyOptions = { baseURL: MOCK_SERVER_URL }

    try {
      await http(kyOptions, { url: 'endpoint', method: 'get' })
      throw new ShouldHaveFailedError()
    } catch (e: any) {
      if (e instanceof ShouldHaveFailedError) {
        throw e
      }

      expect(e.request.path).to.eql({ path: 'endpoint', method: 'get' })

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
