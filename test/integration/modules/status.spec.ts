import * as status from '../../../src/modules/status'
import { beeUrl } from '../../utils'

const BEE_URL = beeUrl()

describe('checkConnection', () => {
  test('should connect to a running node', async () => {
    await status.checkConnection(BEE_URL)
  })
})
