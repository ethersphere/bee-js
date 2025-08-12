import { Bee, Duration, Size } from '../../src'

const bee = new Bee('http://localhost:16337')

test('getExtensionCost should equal getSizeExtensionCost when Duration is 0', async () => {
  const batch = await bee.buyStorage(Size.fromGigabytes(4), Duration.fromDays(30))

  const extensionCost = await bee.getExtensionCost(batch, Size.fromGigabytes(8), Duration.ZERO)
  const sizeExtensionCost = await bee.getSizeExtensionCost(batch, Size.fromGigabytes(8))

  expect(extensionCost).toEqual(sizeExtensionCost)
  expect(extensionCost.toPLURBigInt()).toBeGreaterThan(0)
})

test('getExtensionCost should equal getDurationExtensionCost when depth does not change', async () => {
  const batch = await bee.buyStorage(Size.fromGigabytes(4), Duration.fromDays(30))

  const extensionCost = await bee.getExtensionCost(batch, Size.fromGigabytes(4), Duration.fromDays(30))
  const durationExtensionCost = await bee.getDurationExtensionCost(batch, Duration.fromDays(30))

  expect(extensionCost).toEqual(durationExtensionCost)
  expect(extensionCost.toPLURBigInt()).toBeGreaterThan(0)
})

test('getExtensionCost should equal getDurationExtensionCost twice plus getSizeExtensionCost', async () => {
  const batch = await bee.buyStorage(Size.fromGigabytes(4), Duration.fromDays(30))

  const extensionCost = await bee.getExtensionCost(batch, Size.fromGigabytes(8), Duration.fromDays(30))
  const sizeExtensionCost = await bee.getSizeExtensionCost(batch, Size.fromGigabytes(8))
  const durationExtensionCost = await bee.getDurationExtensionCost(batch, Duration.fromDays(30))

  expect(extensionCost).toEqual(sizeExtensionCost.plus(durationExtensionCost).plus(durationExtensionCost))
  expect(extensionCost.toPLURBigInt()).toBeGreaterThan(0)
})
