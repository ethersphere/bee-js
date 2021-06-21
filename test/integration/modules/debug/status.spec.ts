import { engines } from '../../../../package.json'
import {
  getHealth,
  isSupportedVersion,
  SUPPORTED_BEE_VERSION,
  SUPPORTED_BEE_VERSION_EXACT,
} from '../../../../src/modules/debug/status'
import { beeDebugUrl } from '../../../utils'

/**
 * Matches these:
 * 0.5.3-c423a39c, 0.5.3-c423a39c-dirty, 0.5.3, 1.0.0-rc4, 1.0.0-rc4-02dd4346
 */
const expectValidVersion = (string: string): void => {
  const parts = string.split('-')
  expect(parts.length).toBeGreaterThanOrEqual(1)
  expect(parts.length).toBeLessThanOrEqual(3)
  expect(parts[0]).toMatch(/^\d+\.\d+\.\d+$/)

  if (parts[1]) {
    if (parts[1].startsWith('rc')) {
      expect(parts[1]).toMatch(/^rc\d+$/)

      if (parts[2]) {
        expect(parts[2]).toMatch(/^[0-9a-f]{7,8}$/)
      }
    } else {
      expect(parts[1]).toMatch(/^[0-9a-f]{7,8}$/)

      if (parts[2]) {
        expect(parts[2]).toBe('dirty')
      }
    }
  }
}

const BEE_DEBUG_URL = beeDebugUrl()

describe('modules/status', () => {
  test('getHealth', async () => {
    const health = await getHealth(BEE_DEBUG_URL)

    expect(health.status).toBe('ok')
    // Matches both versions like 0.5.3-c423a39c, 0.5.3-c423a39c-dirty and 0.5.3
    expectValidVersion(health.version)
  })

  test('isSupportedVersion', async () => {
    const isSupported = await isSupportedVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('format of supported bee version', () => {
    // Matches semantic version e.g. 0.5.3
    expect(SUPPORTED_BEE_VERSION).toMatch(/^\d+\.\d+\.\d+$/i)

    // Matches semantic version with commit message e.g. 0.5.3-acbd0e2
    expectValidVersion(SUPPORTED_BEE_VERSION_EXACT)
  })

  test('SUPPORTED_BEE_VERSION_EXACT should come from package.json', () => {
    expect(SUPPORTED_BEE_VERSION_EXACT).toBe(engines.bee)
  })
})
