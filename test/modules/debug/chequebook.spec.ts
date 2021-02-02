import { getChequebookAddress, getChequeubookBalance } from '../../../src/modules/debug/chequebook'
import { isHexString } from '../../../src/utils/hex'
import { beeDebugUrl } from '../../utils'

describe('chequebook', () => {
  test('address', async () => {
    const response = await getChequebookAddress(beeDebugUrl())

    /* eslint-disable no-console */
    console.debug({ response })
    /* eslint-enable no-console */

    expect(isHexString(response.address)).toBeTruthy()
  })

  test('balance', async () => {
    const response = await getChequeubookBalance(beeDebugUrl())

    expect(typeof response.availableBalance).toBe('number')
    expect(typeof response.totalBalance).toBe('number')
  })
})
