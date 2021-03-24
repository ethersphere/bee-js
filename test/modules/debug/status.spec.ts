import { getHealth } from '../../../src/modules/debug/status'
import { beeDebugUrl } from '../../utils'

const BEE_DEBUG_URL = beeDebugUrl()

describe('modules/status', () => {
  test('getHealth', async () => {
    const health = await getHealth(BEE_DEBUG_URL)

    expect(health.status).toBe('ok')
    // Matches both versions like 0.5.3-c423a39c and 0.5.3
    expect(health.version).toMatch(/\d+\.\d+\.\d+(-[0-9a-f]+)?/i)
  })
})
