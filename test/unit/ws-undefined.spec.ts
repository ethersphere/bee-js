import { Dates, System } from 'cafe-utility'
import { Bee, NULL_IDENTIFIER, NULL_OWNER } from '../../src'

test('WebSocket undefined headers', async () => {
  const bee = new Bee('http://127.0.0.1:1633', {
    headers: undefined,
  })

  const subscription = bee.gsocSubscribe(NULL_OWNER, NULL_IDENTIFIER, {
    onMessage: () => {
      void 0
    },
    onError: () => {
      void 0
    },
  })

  subscription.cancel()

  await System.sleepMillis(Dates.seconds(1))
})
