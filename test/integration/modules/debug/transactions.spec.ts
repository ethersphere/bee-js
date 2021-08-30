import * as transactions from '../../../../src/modules/debug/transactions'
import { beeDebugKy, commonMatchers } from '../../../utils'

commonMatchers()

describe('transactions', () => {
  it('should get at least empty array for listing', async () => {
    await expect(transactions.getAllTransactions(beeDebugKy())).resolves.toBeType('array')
  })
})
