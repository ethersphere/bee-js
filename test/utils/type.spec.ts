/* eslint @typescript-eslint/no-empty-function: 0 */
import { isInteger } from '../../src/utils/type'

describe('type', () => {
  describe('isInteger', () => {
    const wrongValues = [
      () => {},
      Number.MAX_SAFE_INTEGER + 1,
      Number.MIN_SAFE_INTEGER - 1,
      5.000000000000001,
      false,
      true,
      Infinity,
      NaN,
      [1],
    ]
    const correctValues = [5, 0, BigInt(10), 5.0000000000000001]

    wrongValues.forEach(v =>
      test(`should return false for value  ${v}`, () => {
        expect(isInteger((v as unknown) as number | BigInt)).toEqual(false)
      }),
    )

    correctValues.forEach(v =>
      test(`should return true for value  ${v}`, () => {
        expect(isInteger((v as unknown) as number | BigInt)).toEqual(true)
      }),
    )
  })
})
