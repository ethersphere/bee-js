import * as pss from '../../src/modules/pss'
import { beeUrl } from '../utils'

const BEE_URL = beeUrl()

describe('modules/pss', () => {
  it('should send PSS message', async (done) => {
    const topic = 'pss topic'
    const target = '0f9c'
    const message = 'hello'
    const response = await pss.send(BEE_URL, topic, target, message)
  })
})
