import nock from 'nock'
import { BeeResponseError } from '../../../src'
import { http } from '../../../src/utils/http'
import { MOCK_SERVER_URL } from '../nock'

class ShouldHaveFailedError extends Error {}

describe('http', () => {
  it('should handle json with data for array', async function () {
    const JSON_RESPONSE = `[1,2,5]`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(200, JSON_RESPONSE)
    const requestOptions = { baseURL: MOCK_SERVER_URL }
    const response = await http(requestOptions, { url: 'endpoint', responseType: 'json', method: 'get' })
    expect(await response.data).toEqual(JSON.parse(JSON_RESPONSE))
  })

  // TODO: figure out how to deal with valid response in wrong type
  it.skip('should handle non-json response for 200', async function () {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(200, HTML_RESPONSE)
    const requestOptions = { baseURL: MOCK_SERVER_URL }

    await expect(http(requestOptions, { url: 'endpoint', responseType: 'json', method: 'get' })).rejects.toThrow(Error)
  })

  it('should handle non-json response for 404', async function () {
    const HTML_RESPONSE = `<html><body><h1>Some error!</h1></body></html>`

    nock(MOCK_SERVER_URL).get('/endpoint').reply(404, HTML_RESPONSE)
    const requestOptions = { baseURL: MOCK_SERVER_URL }

    await expect(http(requestOptions, { url: 'endpoint', responseType: 'json', method: 'get' })).rejects.toThrow(Error)
  })

  it('should give options when thrown error', async function () {
    nock(MOCK_SERVER_URL).get('/endpoint').reply(400, 'Some error')
    const requestOptions = { baseURL: MOCK_SERVER_URL }

    try {
      await http(requestOptions, { url: 'endpoint', method: 'get' })
      throw new ShouldHaveFailedError()
    } catch (e: any) {
      if (e instanceof ShouldHaveFailedError) {
        throw e
      }

      expect(e).toBeInstanceOf(BeeResponseError)
      const error = e as BeeResponseError
      expect(error.method).toBe('get')
      expect(error.url).toBe('endpoint')
      expect(error.responseBody).toBe('Some error')
    }
  })
})
