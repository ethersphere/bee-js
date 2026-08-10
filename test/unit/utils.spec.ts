import { Duration, RedundancyLevel, Utils } from '../../src'

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
  // Values now come from swarm-core's canonical Reed-Solomon parity tables
  // (ported directly from Bee's pkg/file/redundancy/level.go) instead of bee-js's
  // own second, independent approximation table, which was off by one threshold
  // per level.
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.OFF, false)).toBe(0)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.MEDIUM, false)).toEqual(0.09)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.STRONG, false)).toBe(0.2)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.INSANE, false)).toBe(0.31)
  expect(Utils.approximateOverheadForRedundancyLevel(100, RedundancyLevel.PARANOID, false)).toBe(0.89)
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
  expect(Utils.makeMaxTarget('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe('1234')
})

test('Utils.getStampCost', () => {
  const cost = Utils.getStampCost(17, '414720000')
  expect(cost.toPLURBigInt()).toBe(54358179840000n)
  expect(cost.toPLURString()).toBe('54358179840000')
  expect(cost.toDecimalString()).toBe('0.0054358179840000')
})

test('Utils.getStampEffectiveBytes', () => {
  expect(Utils.getStampEffectiveBytes(21)).toBe(2380000000) // 2.38 GB
  expect(Utils.getStampEffectiveBytes(22)).toBe(7070000000) // 4.93 GB
})

test('Utils.getStampMaximumCapacityBytes', () => {
  expect(Utils.getStampTheoreticalBytes(17)).toBe(536870912) // 512 MB
  expect(Utils.getStampEffectiveBytes(25) / Utils.getStampTheoreticalBytes(25)).toBe(0.7021299097687006)
})

test('Utils.getStampDuration', () => {
  expect(Utils.getStampDuration(414720000n, 24000, 5).toSeconds()).toBe(86400)
  expect(Utils.getStampDuration(Utils.getAmountForDuration(Duration.fromDays(365), 24000, 5), 24000, 5).toDays()).toBe(
    365,
  )
})

test('Utils.getStampUsage', () => {
  expect(Utils.getStampUsage(1, 17, 16)).toBe(0.5)
  expect(Utils.getStampUsage(63, 22, 16)).toBe(0.984375) // 63 / (2 ^ (22 - 16))
  expect(Utils.getStampUsage(64, 22, 16)).toBe(1)
})
