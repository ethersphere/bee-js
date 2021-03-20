/* eslint @typescript-eslint/no-empty-function: 0 */
import { BeeDebug } from '../src'
import { beeDebugUrl } from './utils'

describe('Bee class', () => {
  const BEE_DEBUG_URL = beeDebugUrl()
  const beeDebug = new BeeDebug(BEE_DEBUG_URL)

  it(`should throw on wrong withdraw amount type`, () => {
    const wrongValues = [() => {}, Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER - 1, -1, 5.1]
    wrongValues.forEach(v =>
      test(`withdraw`, () => {
        expect(beeDebug.withdrawTokens((v as unknown) as number | BigInt)).toThrowError()
        expect(beeDebug.depositTokens((v as unknown) as number | BigInt)).toThrowError()
      }),
    )
  })
})
