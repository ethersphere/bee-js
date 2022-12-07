import * as transactions from '../../../../src/modules/debug/transactions'
import { beeDebugKyOptions, commonMatchers } from '../../../utils'

commonMatchers()

describe('transactions', () => {
  it('should get at least empty array for listing', async () => {
    await expect(transactions.getAllTransactions(beeDebugKyOptions())).resolves.toBeType('array')
  })
})
