import {
  getHealth,
  isSupportedVersion,
  SUPPORTED_BEE_VERSION,
  SUPPORTED_BEE_VERSION_EXACT,
} from '../../../src/modules/debug/status'
import { beeDebugUrl } from '../../utils'
import { engines } from '../../../package.json'

const BEE_DEBUG_URL = beeDebugUrl()

describe('modules/status', () => {
  test('getHealth', async () => {
    const health = await getHealth(BEE_DEBUG_URL)

    expect(health.status).toBe('ok')
    // Matches both versions like 0.5.3-c423a39c and 0.5.3
    expect(health.version).toMatch(/^\d+\.\d+\.\d+(-[0-9a-f]+)?$/i)
  })

  test('isSupportedVersion', async () => {
    const isSupported = await isSupportedVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('format of supported bee version', () => {
    // Matches semantic version e.g. 0.5.3
    expect(SUPPORTED_BEE_VERSION).toMatch(/^\d+\.\d+\.\d+$/i)

    // Matches semantic version with commit message e.g. 0.5.3-acbd0e2
    expect(SUPPORTED_BEE_VERSION_EXACT).toMatch(/^\d+\.\d+\.\d+(-[0-9a-f]+)$/i)
  })

  test('SUPPORTED_BEE_VERSION_EXACT should come from package.json', () => {
    expect(SUPPORTED_BEE_VERSION_EXACT).toBe(engines.bee)
  })
})
