import * as transactions from '../../../../src/modules/debug/transactions'
import { beeKyOptions, commonMatchers } from '../../../utils'

commonMatchers()

describe('transactions', () => {
  it('should get at least empty array for listing', async function () {
    expect(await transactions.getAllTransactions(beeKyOptions())).toBeInstanceOf(Array)
  })
})
