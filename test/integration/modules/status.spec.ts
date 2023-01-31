import * as status from '../../../src/modules/status'
import { beeKyOptions } from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

describe('checkConnection', () => {
  it('should connect to a running node', async function () {
    await status.checkConnection(BEE_KY_OPTIONS)
  })
})
