import {
  getHealth,
  getVersions,
  getReadiness,
  isSupportedApiVersion,
  isSupportedDebugApiVersion,
  isSupportedExactVersion,
  isSupportedMainApiVersion,
  isSupportedVersion,
  SUPPORTED_API_VERSION,
  SUPPORTED_BEE_VERSION_EXACT,
  SUPPORTED_DEBUG_API_VERSION,
} from '../../../../src/modules/debug/status'
import { beeDebugKy } from '../../../utils'
import fs from 'fs'
import path from 'path'
import * as util from 'util'
import semver from 'semver'

const BEE_DEBUG_URL = beeDebugKy()

describe('modules/status', () => {
  test('getHealth', async () => {
    const health = await getHealth(BEE_DEBUG_URL)

    expect(health.status).toBe('ok')
    // Matches both versions like 0.5.3-c423a39c, 0.5.3-c423a39c-dirty and 0.5.3
    expect(semver.valid(health.version)).not.toBeNull()
  })

  test('getReadiness', async () => {
    const isReady = await getReadiness(BEE_DEBUG_URL)

    expect(isReady).toBe(true)
  })

  test('isSupportedVersion', async () => {
    const isSupported = await isSupportedVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('isSupportedExactVersion', async () => {
    const isSupported = await isSupportedExactVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('isSupportedMainApiVersion', async () => {
    const isSupported = await isSupportedMainApiVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('isSupportedDebugApiVersion', async () => {
    const isSupported = await isSupportedDebugApiVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('isSupportedApiVersion', async () => {
    const isSupported = await isSupportedApiVersion(BEE_DEBUG_URL)

    expect(isSupported).toBe(true)
  })

  test('getVersions', async () => {
    const versions = await getVersions(BEE_DEBUG_URL)

    expect(versions).toEqual(
      expect.objectContaining({
        supportedBeeVersion: expect.any(String),
        supportedBeeApiVersion: expect.any(String),
        supportedBeeDebugApiVersion: expect.any(String),
        beeVersion: expect.any(String),
        beeApiVersion: expect.any(String),
        beeDebugApiVersion: expect.any(String),
      }),
    )

    expect(semver.valid(versions.beeVersion)).not.toBeNull()
    expect(semver.valid(versions.beeApiVersion)).not.toBeNull()
    expect(semver.valid(versions.beeDebugApiVersion)).not.toBeNull()
    expect(semver.valid(versions.supportedBeeApiVersion)).not.toBeNull()
    expect(semver.valid(versions.supportedBeeVersion)).not.toBeNull()
    expect(semver.valid(versions.supportedBeeDebugApiVersion)).not.toBeNull()
  })

  test('SUPPORTED_BEE_* should be same as in package.json', async () => {
    const file = await util.promisify(fs.readFile)(path.join(__dirname, '../../../../package.json'))
    const packageJson = JSON.parse(file.toString())

    expect(SUPPORTED_BEE_VERSION_EXACT).toBe(packageJson.engines.bee)
    expect(SUPPORTED_API_VERSION).toBe(packageJson.engines.beeApiVersion)
    expect(SUPPORTED_DEBUG_API_VERSION).toBe(packageJson.engines.beeDebugApiVersion)
  })
})
