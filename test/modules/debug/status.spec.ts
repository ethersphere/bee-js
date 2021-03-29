import { getHealth, getBeeVersions, getBeeVersionLatest } from '../../../src/modules/debug/status'
import { isValidBeeUrl } from '../../../src/utils/url'
import { beeDebugUrl } from '../../utils'

const BEE_DEBUG_URL = beeDebugUrl()

describe('modules/status', () => {
  test('getHealth', async () => {
    const health = await getHealth(BEE_DEBUG_URL)

    expect(health.status).toBe('ok')
    // Matches both versions like 0.5.3-c423a39c and 0.5.3
    expect(health.version).toMatch(/^\d+\.\d+\.\d+(-[0-9a-f]+)?$/i)
  })

  test('getBeeVersions', async () => {
    const versions = await getBeeVersions()

    expect(Array.isArray(versions)).toBeTruthy()

    versions.forEach(v => {
      expect(v.version).toMatch(/^v\d+\.\d+\.\d+$/i)
      expect(Date.parse(v.date) !== NaN).toBeTruthy()
      expect(isValidBeeUrl(v.url)).toBeTruthy()
    })
  })

  test('getBeeVersionLatest', async () => {
    const v = await getBeeVersionLatest()

    expect(v.version).toMatch(/^v\d+\.\d+\.\d+$/i)
    expect(Date.parse(v.date) !== NaN).toBeTruthy()
    expect(isValidBeeUrl(v.url)).toBeTruthy()
  })
})
