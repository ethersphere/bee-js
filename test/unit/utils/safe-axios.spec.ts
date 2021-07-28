import nock from 'nock'
import { Bee } from '../../../src'
import { setDefaultHeaders } from '../../../src/utils/http'

describe('safeAxios', () => {
  describe('setDefaultHeaders', () => {
    it('should set default headers that are added to all requests', async () => {
      const MOCK_SERVER_URL = 'http://localhost:12345/'
      const scope = nock(MOCK_SERVER_URL).get('/').matchHeader('X-Custom-Header', 'some value').reply(200)

      const bee = new Bee(MOCK_SERVER_URL)
      setDefaultHeaders({ 'X-Custom-Header': 'some value' })
      await bee.checkConnection()

      if (!scope.isDone()) {
        throw new Error('Expected call with the header was not performed!')
      }
    })
  })
})
