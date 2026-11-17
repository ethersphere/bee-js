import { FixedPointNumber } from '../../src/utils/fixed-point-number'

describe('FixedPointNumber', () => {
  test('parses decimal strings, including exponents and truncated fractions', () => {
    expect(FixedPointNumber.fromDecimalString('1.5', 18).value).toBe(1_500_000_000_000_000_000n)
    expect(FixedPointNumber.fromDecimalString('1e-7', 18).value).toBe(100_000_000_000n)
    expect(FixedPointNumber.fromDecimalString('1.23456', 3).value).toBe(1234n)
    expect(FixedPointNumber.fromFloat(1.25, 2).value).toBe(125n)
  })

  test('formats as decimal string, float and JSON', () => {
    const number = new FixedPointNumber(5n, 16)

    expect(number.toDecimalString()).toBe('0.0000000000000005')
    expect(number.toFloat()).toBe(5e-16)
    expect(JSON.stringify({ number })).toBe('{"number":"5"}')
  })

  test('adds, subtracts and compares numbers of the same scale', () => {
    const a = new FixedPointNumber(10n, 2)
    const b = new FixedPointNumber(3n, 2)

    expect(a.add(b).value).toBe(13n)
    expect(a.subtract(b).value).toBe(7n)
    expect([a.compare(b), b.compare(a), a.compare(a)]).toEqual([1, -1, 0])
  })

  test('rejects mixed scales, division by zero and negative scales', () => {
    expect(() => new FixedPointNumber(1n, 2).add(new FixedPointNumber(1n, 3))).toThrow(
      'Scale mismatch: expected 2, but got 3',
    )
    expect(() => new FixedPointNumber(1n, 2).divmod(0n)).toThrow('Division by zero is not allowed')
    expect(() => new FixedPointNumber(1n, -1)).toThrow('Scale must be non-negative')
  })

  test('divmod returns quotient and remainder', () => {
    expect(new FixedPointNumber(17n, 0).divmod(5n).map(part => part.value)).toEqual([3n, 2n])
  })

  test('exchange multiplies or divides by a rate into the target scale', () => {
    const bzz = new FixedPointNumber(2n * 10n ** 16n, 16)
    const rate = new FixedPointNumber(3n * 10n ** 18n, 18)

    expect(bzz.exchange('*', rate, 18).value).toBe(6n * 10n ** 18n)
    expect(new FixedPointNumber(6n * 10n ** 18n, 18).exchange('/', rate, 16).value).toBe(2n * 10n ** 16n)
  })
})
