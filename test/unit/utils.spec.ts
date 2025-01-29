import { RedundancyLevel, Utils } from '../../src'

test('Utils.getCollectionSize', () => {
  const files = [
    new File(['Shh!'], 'secret.txt', { type: 'text/plain' }),
    new File(['Hello, World!'], 'hello.txt', { type: 'text/plain' }),
  ]
  expect(Utils.getCollectionSize(files)).toBe(17)
})

test('Utils.getFolderSize', async () => {
  expect(await Utils.getFolderSize('test/data')).toBe(37817)
})

test('Utils.approximateOverheadForRedundancyLevel', () => {
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.OFF, false)).toBe(0)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.MEDIUM, false)).toEqual(0.09574468085106383)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.STRONG, false)).toBe(0.21052631578947367)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.INSANE, false)).toBe(0.33695652173913043)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.PARANOID, false)).toBe(2.4324324324324325)
})

test('Utils.getRedundancyStat', () => {
  expect(Utils.getRedundancyStat('medium')).toMatchObject({
    errorTolerance: 0.01,
    label: 'medium',
    value: 1,
  })
})

test('Utils.getRedundancyStats', () => {
  expect(Utils.getRedundancyStats()).toMatchObject({
    medium: { errorTolerance: 0.01, label: 'medium', value: 1 },
    strong: { errorTolerance: 0.05, label: 'strong', value: 2 },
    insane: { errorTolerance: 0.1, label: 'insane', value: 3 },
    paranoid: { errorTolerance: 0.5, label: 'paranoid', value: 4 },
  })
})

test('Utils.makeMaxTarget', () => {
  expect(Utils.makeMaxTarget('0x1234567890abcdef')).toBe('1234')
})

test('Utils.getAmountForTtl', () => {
  expect(Utils.getAmountForTtl(1)).toBe(414720000n)
})

test('Utils.getDepthForCapacity', () => {
  expect(Utils.getDepthForCapacity(8)).toBe(21)
})

test('Utils.getStampCostInBzz', () => {
  expect(Utils.getStampCostInBzz(17, '414720000')).toBe(0.005435817984)
})

test('Utils.getStampCostInPlur', () => {
  expect(Utils.getStampCostInPlur(17, '414720000')).toBe(54358179840000n)
})

test('Utils.getStampEffectiveBytes', () => {
  expect(Utils.getStampEffectiveBytes(21)).toBe(0)
  expect(Utils.getStampEffectiveBytes(22)).toBe(4925468495.0528) // 4.93 GB
})

test('Utils.getStampMaximumCapacityBytes', () => {
  expect(Utils.getStampMaximumCapacityBytes(17)).toBe(536870912) // 512 MB
  expect(Utils.getStampEffectiveBytes(35) / Utils.getStampMaximumCapacityBytes(35)).toBe(0.99)
})

test('Utils.getStampTtlSeconds', () => {
  expect(Utils.getStampTtlSeconds(414720000n)).toBe(86400n)
  expect(Utils.getStampTtlSeconds(Utils.getAmountForTtl(365))).toBe(86400n * 365n)
})

test('Utils.getStampUsage', () => {
  expect(Utils.getStampUsage(1, 17, 16)).toBe(0.5)
  expect(Utils.getStampUsage(63, 22, 16)).toBe(0.984375) // 63 / (2 ^ (22 - 16))
  expect(Utils.getStampUsage(64, 22, 16)).toBe(1)
})
