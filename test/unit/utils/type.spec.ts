/* eslint @typescript-eslint/no-empty-function: 0 */
import { NumberString } from '../../../src/types'
import { isInteger } from '../../../src/utils/type'

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
    const correctValues = [5, 0, '10', 5.0000000000000001, '-1']

    wrongValues.forEach((v: unknown | NumberString) =>
      test(`should return false for value  ${v}`, () => {
        expect(isInteger(v)).toEqual(false)
      }),
    )

    correctValues.forEach((v: unknown | NumberString) =>
      test(`should return true for value  ${v}`, () => {
        expect(isInteger(v)).toEqual(true)
      }),
    )
  })
})
