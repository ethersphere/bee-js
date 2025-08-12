import { Bee, Size, Utils } from '../../src'
import { Duration } from '../../src/utils/duration'

const bee = new Bee('http://localhost:16337')

test('Utils.getDepthForSize', () => {
  expect(Utils.getDepthForSize(Size.fromGigabytes(0))).toBe(17)
  expect(Utils.getDepthForSize(Size.fromGigabytes(1))).toBe(21)
  expect(Utils.getDepthForSize(Size.fromGigabytes(2))).toBe(21)
  expect(Utils.getDepthForSize(Size.fromGigabytes(3))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(7))).toBe(22)
  expect(Utils.getDepthForSize(Size.fromGigabytes(8))).toBe(23)
  expect(Utils.getDepthForSize(Size.fromGigabytes(18))).toBe(23)
  expect(Utils.getDepthForSize(Size.fromGigabytes(19))).toBe(24)
})

test('Utils.getAmountForDuration', () => {
  expect(Utils.getAmountForDuration(Duration.fromHours(25), 24000, 5)).toBe((414720000n / 24n) * 25n + 1n)
  expect(Utils.getAmountForDuration(Duration.fromDays(1), 24000, 5)).toBe(414720000n + 1n)
  expect(Utils.getAmountForDuration(Duration.fromWeeks(1), 24000, 5)).toBe(414720000n * 7n + 1n)
  expect(Utils.getAmountForDuration(Duration.fromYears(1), 24000, 5)).toBe(414720000n * 365n + 1n)
})

test('bee.getStorageCost', async () => {
  const bzz = await bee.getStorageCost(Size.fromGigabytes(1), Duration.fromDays(2))
  expect(bzz.toSignificantDigits(4)).toBe('0.1739')
})

test('bee.getDurationExtensionCost for 1GB/2days', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(2))
  const bzz = await bee.getDurationExtensionCost(batchId, Duration.fromDays(2))
  expect(bzz.toSignificantDigits(4)).toBe('0.1739')
})

test('bee.getSizeExtensionCost for 1GB/2days', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(2))
  const bzz = await bee.getSizeExtensionCost(batchId, Size.fromGigabytes(3))
  expect(bzz.toSignificantDigits(4)).toBe('0.1739')
})

test('bee.getExtensionCost (size) for 1GB/2days', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(2))
  const bzz = await bee.getExtensionCost(batchId, Size.fromGigabytes(3), Duration.ZERO)
  expect(bzz.toSignificantDigits(4)).toBe('0.1739')
})

test('bee.getExtensionCost (duration) for 1GB/2days', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(2))
  const bzz = await bee.getExtensionCost(batchId, Size.fromGigabytes(1), Duration.fromDays(2))
  expect(bzz.toSignificantDigits(4)).toBe('0.1739')
})

test('bee.getDurationExtensionCost', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(8), Duration.fromDays(1))
  const cost = await bee.getDurationExtensionCost(batchId, Duration.fromDays(31))
  expect(cost.toSignificantDigits(3)).toBe('10.784')
})

test('bee.getSizeExtensionCost', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(8), Duration.fromDays(31))
  const cost = await bee.getSizeExtensionCost(batchId, Size.fromGigabytes(100))
  expect(cost.toSignificantDigits(3)).toBe('75.492')

  await expect(async () => bee.getSizeExtensionCost(batchId, Size.fromGigabytes(1))).rejects.toThrow(
    'New depth has to be greater than the original depth',
  )
})

test('bee.getExtensionCost', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(8), Duration.fromDays(31))
  const cost = await bee.getExtensionCost(batchId, Size.fromGigabytes(18), Duration.fromYears(1))
  expect(cost.toDecimalString()).toBe('126.9807081070788608')
})

test('bee.buyStorage with extensions (extendStorageDuration, extendStorageSize)', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(1))
  await bee.extendStorageDuration(batchId, Duration.fromDays(1))
  await bee.extendStorageSize(batchId, Size.fromGigabytes(8))
  await bee.extendStorageSize(batchId, Size.fromGigabytes(24))
  await expect(async () => bee.extendStorageSize(batchId, Size.fromGigabytes(1))).rejects.toThrow(
    'New depth has to be greater than the original depth',
  )
  const batch = await bee.getPostageBatch(batchId)
  expect(batch.depth).toBe(24)
  expect(batch.duration.toDays()).toBe(2)
  expect(BigInt(batch.amount)).toBe(Utils.getAmountForDuration(Duration.fromDays(2), 24000, 5) + 1n)
})

test('bee.buyStorage with extensions (extendStorage)', async () => {
  const batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(1))
  await bee.extendStorage(batchId, Size.fromGigabytes(1), Duration.fromDays(1))
  await bee.extendStorage(batchId, Size.fromGigabytes(8), Duration.ZERO)
  await bee.extendStorage(batchId, Size.fromGigabytes(24), Duration.ZERO)
  const batch = await bee.getPostageBatch(batchId)
  expect(batch.depth).toBe(24)
  expect(batch.duration.toDays()).toBe(2)
  expect(BigInt(batch.amount)).toBe(Utils.getAmountForDuration(Duration.fromDays(2), 24000, 5) + 1n)
})

test('getStampEffectiveBytesBreakpoints', () => {
  const breakpoints = Utils.getStampEffectiveBytesBreakpoints(false)

  for (const [depth, bytes] of breakpoints) {
    const uxDepth = Utils.getDepthForSize(Size.fromBytes(bytes))
    expect(uxDepth).toBe(depth)
  }

  const values = [...breakpoints.values()]

  expect(values).toEqual([
    Size.fromKilobytes(40.89).toBytes(),
    Size.fromMegabytes(6.09).toBytes(),
    Size.fromMegabytes(102.49).toBytes(),
    Size.fromMegabytes(628.91).toBytes(),
    Size.fromGigabytes(2.38).toBytes(),
    Size.fromGigabytes(7.07).toBytes(),
    Size.fromGigabytes(18.24).toBytes(),
    Size.fromGigabytes(43.04).toBytes(),
    Size.fromGigabytes(96.5).toBytes(),
    Size.fromGigabytes(208.52).toBytes(),
    Size.fromGigabytes(435.98).toBytes(),
    Size.fromGigabytes(908.81).toBytes(),
    Size.fromGigabytes(1870).toBytes(),
    Size.fromGigabytes(3810).toBytes(),
    Size.fromGigabytes(7730).toBytes(),
    Size.fromGigabytes(15610).toBytes(),
    Size.fromGigabytes(31430).toBytes(),
    Size.fromGigabytes(63150).toBytes(),
  ])
})
