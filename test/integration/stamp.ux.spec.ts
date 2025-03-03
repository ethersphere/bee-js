import { Bee, Utils } from '../../src'
import { Duration } from '../../src/utils/duration'
import { mocked } from '../mocks'

test('Utils.getDepthForSize', () => {
  expect(Utils.getDepthForSize(0)).toBe(22)
  expect(Utils.getDepthForSize(1)).toBe(22)
  expect(Utils.getDepthForSize(2)).toBe(22)
  expect(Utils.getDepthForSize(3)).toBe(22)
  expect(Utils.getDepthForSize(4)).toBe(22)
  expect(Utils.getDepthForSize(5)).toBe(23)
  expect(Utils.getDepthForSize(17)).toBe(23)
  expect(Utils.getDepthForSize(18)).toBe(24)
})

test('Utils.getAmountForDuration', () => {
  expect(Utils.getAmountForDuration(Duration.fromHours(25), 24000)).toBe((414720000n / 24n) * 25n)
  expect(Utils.getAmountForDuration(Duration.fromDays(1), 24000)).toBe(414720000n)
  expect(Utils.getAmountForDuration(Duration.fromWeeks(1), 24000)).toBe(414720000n * 7n)
  expect(Utils.getAmountForDuration(Duration.fromYears(1), 24000)).toBe(414720000n * 365n)
})

test('bee.getStorageCost', async () => {
  await mocked(async (bee: Bee) => {
    const bzz = await bee.getStorageCost(4, Duration.fromDays(1))
    expect(bzz.toSignificantDigits(3)).toBe('0.192')
  })
})

test('bee.getDurationExtensionCost', async () => {
  await mocked(async (bee: Bee) => {
    const cost = await bee.getDurationExtensionCost(
      'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      Duration.fromDays(31),
    )
    expect(cost.toSignificantDigits(3)).toBe('11.934')
  })
})

test('bee.getSizeExtensionCost', async () => {
  await mocked(async (bee: Bee) => {
    const cost = await bee.getSizeExtensionCost('f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa', 18)
    expect(cost.toSignificantDigits(3)).toBe('72.011')

    await expect(() =>
      bee.getSizeExtensionCost('f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa', 1),
    ).rejects.toThrow('New depth has to be greater than the original depth')
  })
})

test('bee.getExtensionCost', async () => {
  await mocked(async (bee: Bee) => {
    const cost = await bee.getExtensionCost(
      'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      18,
      Duration.fromYears(1),
    )
    expect(cost.toDecimalString()).toBe('209.0182760562950144')
  })
})

test('bee.buyStorage with extensions', async () => {
  const calls = await mocked(async (bee: Bee) => {
    const batchId = await bee.buyStorage(1, Duration.fromDays(1))
    await bee.buyStorage(1, Duration.fromDays(1), { waitForUsable: false })
    await bee.extendStorageDuration(batchId, Duration.fromDays(1))
    await bee.extendStorageSize(batchId, 8)
    await bee.extendStorageSize(batchId, 24)
    await expect(() => bee.extendStorageSize(batchId, 1)).rejects.toThrow(
      'New depth has to be greater than the original depth',
    )
  })
  expect(calls).toEqual([
    // create stamp
    'GET /chainstate',
    'GET /chainstate',
    'POST /stamps/458922240/22',
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    // create stamp, do not wait for usable
    'GET /chainstate',
    'GET /chainstate',
    'POST /stamps/458922240/22',
    // extend duration
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    'GET /chainstate',
    'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/458922240',
    // extend size +1 depth
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/458922240',
    'PATCH /stamps/dilute/b330000000000000000000000000000000000000000000000000000000000000/23',
    // extend size +2 depth
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/917844480',
    'PATCH /stamps/dilute/b330000000000000000000000000000000000000000000000000000000000000/24',
    // error case
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
  ])
})
