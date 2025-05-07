import { Bee, Size, Utils } from '../../src'
import { Duration } from '../../src/utils/duration'
import { mocked } from '../mocks'

test('Utils.getDepthForSize', () => {
  expect(Utils.getDepthForSize(Size.fromGigabytes(0))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(1))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(2))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(3))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(4))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(5))).toBe(23)
  expect(Utils.getDepthForSize(Size.fromGigabytes(17))).toBe(23)
  expect(Utils.getDepthForSize(Size.fromGigabytes(18))).toBe(24)
})

test('Utils.getAmountForDuration', () => {
  expect(Utils.getAmountForDuration(Duration.fromHours(25), 24000, 5)).toBe((414720000n / 24n) * 25n + 1n)
  expect(Utils.getAmountForDuration(Duration.fromDays(1), 24000, 5)).toBe(414720000n + 1n)
  expect(Utils.getAmountForDuration(Duration.fromWeeks(1), 24000, 5)).toBe(414720000n * 7n + 1n)
  expect(Utils.getAmountForDuration(Duration.fromYears(1), 24000, 5)).toBe(414720000n * 365n + 1n)
})

test('bee.getStorageCost', async () => {
  await mocked(async bee => {
    const bzz = await bee.getStorageCost(Size.fromGigabytes(4), Duration.fromDays(1))
    expect(bzz.toSignificantDigits(3)).toBe('0.192')
  })
})

test('bee.getDurationExtensionCost', async () => {
  await mocked(async bee => {
    const cost = await bee.getDurationExtensionCost(
      'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      Duration.fromDays(31),
    )
    expect(cost.toSignificantDigits(3)).toBe('11.934')
  })
})

test('bee.getSizeExtensionCost', async () => {
  await mocked(async bee => {
    const cost = await bee.getSizeExtensionCost(
      'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      Size.fromGigabytes(18),
    )
    expect(cost.toSignificantDigits(3)).toBe('72.011')

    await expect(() =>
      bee.getSizeExtensionCost(
        'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
        Size.fromGigabytes(1),
      ),
    ).rejects.toThrow('New depth has to be greater than the original depth')
  })
})

test('bee.getExtensionCost', async () => {
  await mocked(async (bee: Bee) => {
    const cost = await bee.getExtensionCost(
      'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
      Size.fromGigabytes(18),
      Duration.fromYears(1),
    )
    expect(cost.toDecimalString()).toBe('209.0182760579727360')
  })
})

test('bee.buyStorage with extensions', async () => {
  const calls = await mocked(async (bee: Bee) => {
    const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(1))
    await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(1), { waitForUsable: false })
    await bee.extendStorageDuration(batchId, Duration.fromDays(1))
    await bee.extendStorageSize(batchId, Size.fromGigabytes(8))
    await bee.extendStorageSize(batchId, Size.fromGigabytes(24))
    await expect(() => bee.extendStorageSize(batchId, Size.fromGigabytes(1))).rejects.toThrow(
      'New depth has to be greater than the original depth',
    )
  })
  expect(calls.map(x => `${x.method} ${x.url}`)).toEqual([
    // create stamp
    'GET /chainstate',
    'GET /chainstate',
    'POST /stamps/458922241/22',
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    // create stamp, do not wait for usable
    'GET /chainstate',
    'GET /chainstate',
    'POST /stamps/458922241/22',
    // extend duration
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    'GET /chainstate',
    'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/458922241',
    // extend size +1 depth
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/458922241',
    'PATCH /stamps/dilute/b330000000000000000000000000000000000000000000000000000000000000/23',
    // extend size +2 depth
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
    'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/917844481',
    'PATCH /stamps/dilute/b330000000000000000000000000000000000000000000000000000000000000/24',
    // error case
    'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
  ])
})

test('getStampEffectiveBytesBreakpoints', () => {
  const breakpoints = Utils.getStampEffectiveBytesBreakpoints()

  for (const [depth, bytes] of breakpoints) {
    const uxDepth = Utils.getDepthForSize(Size.fromBytes(bytes))
    expect(uxDepth).toBe(depth)
  }

  const values = [...breakpoints.values()]

  expect(values).toEqual([
    4925468496, 17028686336, 44207239385, 102776849407, 225867176136, 480431605757, 1001435190579, 2060264888127,
    4201893636709, 8519016092009, 17199880295626, 34628459009829, 69587651117292,
  ])
})
