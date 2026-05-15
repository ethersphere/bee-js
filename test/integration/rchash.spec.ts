import { makeBee } from '../utils'

test('GET rchash', async () => {
  const bee = makeBee()
  const addresses = await bee.getNodeAddresses()
  const durationSeconds = await bee.rchash(
    2,
    addresses.overlay.toHex().slice(0, 4),
    addresses.overlay.toHex().slice(0, 4),
  )
  expect(durationSeconds).toBeGreaterThan(1)
  expect(durationSeconds).toBeLessThan(60)
})
