import { MOCK_SERVER_URL } from '../nock'
import { http } from '../../../src/utils/http'
import nock from 'nock'
import ky from 'ky-universal'
import { BeeNotAJsonError, BeeResponseError } from '../../../src'

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
})
