import { Types } from 'cafe-utility'
import { mocked } from '../mocks'
import { batch } from '../utils'

test('bee-js/986 - Headers not merging properly', async () => {
  const calls = await mocked(async bee => {
    await bee.file.upload(
      batch(),
      'Does not matter',
      'filename.txt',
      { act: true, tag: 1337, encrypt: true },
      { headers: {} },
    )
    await bee.file.upload(
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
  expect(calls[0]).toMatchObject({
    headers: {
      accept: 'application/json, text/plain, */*',
      'swarm-act': 'true',
      'swarm-encrypt': 'true',
      'swarm-postage-batch-id': Types.asString(process.env.JEST_MANAGED_BATCH_ID),
      'swarm-tag': '1337',
    },
    method: 'POST',
    url: '/bzz?name=filename.txt',
  })
  expect(calls[1]).toMatchObject({
    headers: {
      accept: 'application/json, text/plain, */*',
      arbitrary: 'value',
      'swarm-act': 'true',
      'swarm-encrypt': 'true',
      'swarm-postage-batch-id': Types.asString(process.env.JEST_MANAGED_BATCH_ID),
      'swarm-tag': '1338',
    },
    method: 'POST',
    url: '/bzz?name=filename.txt',
  })
})
