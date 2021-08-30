import * as status from '../../../src/modules/status'
import { beeKy } from '../../utils'

const BEE_KY = beeKy()

describe('checkConnection', () => {
  test('should connect to a running node', async () => {
    await status.checkConnection(BEE_KY)
  })
})
