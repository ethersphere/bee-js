import { mocked } from '../mocks'
import { batch } from '../utils'

test('bee-js/986 - Headers not merging properly', async () => {
  const calls = await mocked(async bee => {
    await bee.uploadFile(
      batch(),
      'Does not matter',
      'filename.txt',
      { act: true, tag: 1337, encrypt: true },
      { headers: {} },
    )
    await bee.uploadFile(
      batch(),
      'Does not matter',
      'filename.txt',
      { act: true, tag: 1338, encrypt: true },
      {
        headers: {
          arbitrary: 'value',
        },
      },
    )
  })
  expect(calls).toHaveLength(2)
  expect(calls[0]).toEqual({
    headers: {
      accept: 'application/json, text/plain, */*',
      connection: 'keep-alive',
      'content-length': '15',
      'content-type': 'application/x-www-form-urlencoded',
      host: 'localhost:11633',
      'swarm-act': 'true',
      'swarm-encrypt': 'true',
      'swarm-postage-batch-id': 'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      'swarm-tag': '1337',
      'user-agent': 'axios/0.30.0',
    },
    method: 'POST',
    url: '/bzz?name=filename.txt',
  })
  expect(calls[1]).toEqual({
    headers: {
      accept: 'application/json, text/plain, */*',
      arbitrary: 'value',
      connection: 'keep-alive',
      'content-length': '15',
      'content-type': 'application/x-www-form-urlencoded',
      host: 'localhost:11633',
      'swarm-act': 'true',
      'swarm-encrypt': 'true',
      'swarm-postage-batch-id': 'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      'swarm-tag': '1338',
      'user-agent': 'axios/0.30.0',
    },
    method: 'POST',
    url: '/bzz?name=filename.txt',
  })
})
