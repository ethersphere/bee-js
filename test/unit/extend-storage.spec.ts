import { Dates, System } from 'cafe-utility'
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

test('extendStorage should not throw when relative amount is negative', async () => {
  const oneMonth = new Date(Date.now() + Dates.days(31))
  const batchId = await bee.buyStorage(Size.fromGigabytes(4), Duration.fromEndDate(oneMonth))
  await System.sleepMillis(Dates.seconds(3))
  {
    const batch = await bee.getPostageBatch(batchId)
    await bee.extendStorage(batchId, Size.fromGigabytes(8), Duration.fromEndDate(oneMonth, batch.duration.toEndDate()))
  }
  const batch = await bee.getPostageBatch(batchId)
  expect(batch.size.toGigabytes()).toBe(18.24)
  expect(batch.duration.toDays()).toBe(31)
})

test('extendStorage should not throw when only depth delta is negative', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(4), Duration.fromDays(30))
  await bee.extendStorage(batchId, Size.fromGigabytes(1), Duration.fromDays(30))
  const batch = await bee.getPostageBatch(batchId)
  expect(batch.size.toGigabytes()).toBe(7.07)
  expect(batch.duration.toDays()).toBe(60)
})

test('getExtensionCost should handle zero size', async () => {
  const originalCost = await bee.getStorageCost(Size.fromGigabytes(1), Duration.fromDays(42))
  expect(originalCost.toDecimalString()).toBe('3.6528696854577152')
  const batch = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(42))

  const extensionCost = await bee.getExtensionCost(batch, Size.fromGigabytes(0), Duration.fromDays(42))

  expect(extensionCost.toDecimalString()).toEqual('3.6528696854577152')
})
