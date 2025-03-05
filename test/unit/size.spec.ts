import { Size } from '../../src'

test('Size.toFormattedString', () => {
  expect(Size.fromBytes(1000).toFormattedString()).toBe('1.000 KB')
  expect(Size.fromBytes(10000).toFormattedString()).toBe('10.000 KB')
  expect(Size.fromBytes(100000).toFormattedString()).toBe('100.000 KB')
  expect(Size.fromBytes(1000000).toFormattedString()).toBe('1.000 MB')
  expect(Size.fromBytes(10000000).toFormattedString()).toBe('10.000 MB')
  expect(Size.fromBytes(100000000).toFormattedString()).toBe('100.000 MB')
  expect(Size.fromGigabytes(1).toFormattedString()).toBe('1.000 GB')
  expect(Size.fromGigabytes(10).toFormattedString()).toBe('10.000 GB')
  expect(Size.fromGigabytes(100).toFormattedString()).toBe('100.000 GB')
  expect(Size.fromGigabytes(1000).toFormattedString()).toBe('1.000 TB')
  expect(Size.fromGigabytes(10000).toFormattedString()).toBe('10.000 TB')
  expect(Size.fromGigabytes(100000).toFormattedString()).toBe('100.000 TB')
  expect(Size.fromGigabytes(1000000).toFormattedString()).toBe('1000.000 TB')
  expect(Size.fromGigabytes(10000000).toFormattedString()).toBe('10000.000 TB')
})
