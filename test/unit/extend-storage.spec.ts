import { Dates, System } from 'cafe-utility'
import { Bee, Duration, Size } from '../../src'

const bee = new Bee('http://localhost:16337')

test('extendStorage should never decrease duration', async () => {
  const batchId = await bee.storage.buy(Size.fromMegabytes(1), Duration.fromDays(30))
  await bee.storage.extend(batchId, Size.fromMegabytes(100), Duration.fromDays(1))
  const batch = await bee.stamp.get(batchId)
  expect(batch.duration.toDays()).toBeGreaterThanOrEqual(30)
})

test('getExtensionCost should equal getSizeExtensionCost when Duration is 0', async () => {
  const batch = await bee.storage.buy(Size.fromGigabytes(4), Duration.fromDays(30))

  const extensionCost = await bee.storage.getExtensionCost(batch, Size.fromGigabytes(8), Duration.ZERO)
  const sizeExtensionCost = await bee.storage.getSizeExtensionCost(batch, Size.fromGigabytes(8))

  expect(extensionCost).toEqual(sizeExtensionCost)
  expect(extensionCost.toPLURBigInt()).toBeGreaterThan(0)
})

test('getExtensionCost should equal getDurationExtensionCost when depth does not change', async () => {
  const batch = await bee.storage.buy(Size.fromGigabytes(4), Duration.fromDays(30))

  const extensionCost = await bee.storage.getExtensionCost(batch, Size.fromGigabytes(4), Duration.fromDays(30))
  const durationExtensionCost = await bee.storage.getDurationExtensionCost(batch, Duration.fromDays(30))

  expect(extensionCost).toEqual(durationExtensionCost)
  expect(extensionCost.toPLURBigInt()).toBeGreaterThan(0)
})

test('getExtensionCost should equal getDurationExtensionCost twice plus getSizeExtensionCost', async () => {
  const batch = await bee.storage.buy(Size.fromGigabytes(4), Duration.fromDays(30))

  const extensionCost = await bee.storage.getExtensionCost(batch, Size.fromGigabytes(8), Duration.fromDays(30))
  const sizeExtensionCost = await bee.storage.getSizeExtensionCost(batch, Size.fromGigabytes(8))
  const durationExtensionCost = await bee.storage.getDurationExtensionCost(batch, Duration.fromDays(30))

  expect(extensionCost).toEqual(sizeExtensionCost.plus(durationExtensionCost).plus(durationExtensionCost))
  expect(extensionCost.toPLURBigInt()).toBeGreaterThan(0)
})

test('extendStorage should not throw when relative amount is negative', async () => {
  const oneMonth = new Date(Date.now() + Dates.days(31))
  const batchId = await bee.storage.buy(Size.fromGigabytes(4), Duration.fromEndDate(oneMonth))
  await System.sleepMillis(Dates.seconds(3))
  {
    const batch = await bee.stamp.get(batchId)
    await bee.storage.extend(batchId, Size.fromGigabytes(8), Duration.fromEndDate(oneMonth, batch.duration.toEndDate()))
  }
  const batch = await bee.stamp.get(batchId)
  expect(batch.size.toGigabytes()).toBe(18.24)
  expect(batch.duration.toDays()).toBe(31)
})

test('extendStorage should not throw when only depth delta is negative', async () => {
  const batchId = await bee.storage.buy(Size.fromGigabytes(4), Duration.fromDays(30))
  await bee.storage.extend(batchId, Size.fromGigabytes(1), Duration.fromDays(30))
  const batch = await bee.stamp.get(batchId)
  expect(batch.size.toGigabytes()).toBe(7.07)
  expect(batch.duration.toDays()).toBe(60)
})

test('extendStorage should succeed when duration is zero but size increases', async () => {
  const batchId = await bee.storage.buy(Size.fromGigabytes(1), Duration.fromDays(30))
  await bee.storage.extend(batchId, Size.fromGigabytes(4), Duration.ZERO)
  const batch = await bee.stamp.get(batchId)
  expect(batch.size.toGigabytes()).toBeGreaterThan(3)
  expect(batch.duration.toDays()).toBeGreaterThanOrEqual(30)
})

test('extendStorage should throw with a sensible error when duration is zero and size does not increase', async () => {
  const batchId = await bee.storage.buy(Size.fromGigabytes(4), Duration.fromDays(30))
  await expect(bee.storage.extend(batchId, Size.fromMegabytes(1), Duration.ZERO)).rejects.toThrow(
    'Nothing to extend, both size and duration are already sufficient',
  )
})

test('getExtensionCost should handle zero size', async () => {
  const originalCost = await bee.storage.getCost(Size.fromGigabytes(1), Duration.fromDays(42))
  expect(originalCost.toDecimalString()).toBe('3.6528696854577152')
  const batch = await bee.storage.buy(Size.fromGigabytes(1), Duration.fromDays(42))

  const extensionCost = await bee.storage.getExtensionCost(batch, Size.fromGigabytes(0), Duration.fromDays(42))

  expect(extensionCost.toDecimalString()).toEqual('3.6528696854577152')
})
