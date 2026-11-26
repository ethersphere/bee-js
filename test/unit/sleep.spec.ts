import { sleepMillis } from '../../src/utils/sleep'

test('sleepMillis waits at least the given time', async () => {
  const start = Date.now()
  await sleepMillis(20)

  expect(Date.now() - start).toBeGreaterThanOrEqual(15)
})
