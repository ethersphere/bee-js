import { makeBee } from '../utils'

test('GET rchash', async () => {
  const bee = makeBee()
  const durationSeconds = await bee.rchash(15, '0bab', '0bab')
  expect(durationSeconds).toBeGreaterThan(1)
  expect(durationSeconds).toBeLessThan(60)
})
