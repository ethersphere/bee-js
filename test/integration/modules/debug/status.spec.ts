import fs from 'fs'
import path from 'path'
import semver from 'semver'
import * as util from 'util'
import {
  getHealth,
  getReadiness,
  getVersions,
  isSupportedApiVersion,
  isSupportedExactVersion,
  isSupportedMainApiVersion,
  isSupportedVersion,
  SUPPORTED_API_VERSION,
  SUPPORTED_BEE_VERSION_EXACT,
} from '../../../../src/modules/debug/status'
import { beeKyOptions } from '../../../utils'

const BEE_URL = beeKyOptions()

describe('modules/status', () => {
  it('getHealth', async function () {
    const health = await getHealth(BEE_URL)

    expect(health.status).toBe('ok')
    // Matches both versions like 0.5.3-c423a39c, 0.5.3-c423a39c-dirty and 0.5.3
    expect(semver.valid(health.version)).not.toBeNull()
  })

  it('getReadiness', async function () {
    const isReady = await getReadiness(BEE_URL)

    expect(isReady).toBe(true)
  })

  it('isSupportedVersion', async function () {
    const isSupported = await isSupportedVersion(BEE_URL)

    expect(isSupported).toBe(true)
  })

  it('isSupportedExactVersion', async function () {
    const isSupported = await isSupportedExactVersion(BEE_URL)

    expect(isSupported).toBe(true)
  })

  it('isSupportedMainApiVersion', async function () {
    const isSupported = await isSupportedMainApiVersion(BEE_URL)

    expect(isSupported).toBe(true)
  })

  it('isSupportedApiVersion', async function () {
    const isSupported = await isSupportedApiVersion(BEE_URL)

    expect(isSupported).toBe(true)
  })

  it('getVersions', async function () {
    const versions = await getVersions(BEE_URL)

    expect(versions).toEqual(
      expect.objectContaining({
        supportedBeeVersion: expect.any(String),
        supportedBeeApiVersion: expect.any(String),
        beeVersion: expect.any(String),
        beeApiVersion: expect.any(String),
      }),
    )

    expect(semver.valid(versions.beeVersion)).not.toBeNull()
    expect(semver.valid(versions.beeApiVersion)).not.toBeNull()
    expect(semver.valid(versions.supportedBeeApiVersion)).not.toBeNull()
    expect(semver.valid(versions.supportedBeeVersion)).not.toBeNull()
  })

  it('SUPPORTED_BEE_* should be same as in package.json', async function () {
    const file = await util.promisify(fs.readFile)(path.join(__dirname, '../../../../package.json'))
    const packageJson = JSON.parse(file.toString())

    expect(SUPPORTED_BEE_VERSION_EXACT).toBe(packageJson.engines.bee)
    expect(SUPPORTED_API_VERSION).toBe(packageJson.engines.beeApiVersion)
  })
})
