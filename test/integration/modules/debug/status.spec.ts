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
import { beeDebugKyOptions } from '../../../utils'
import fs from 'fs'
import path from 'path'
import * as util from 'util'
import semver from 'semver'
import { expect } from 'chai'
import { expect as jestExpect } from 'expect'

const BEE_DEBUG_URL = beeDebugKyOptions()

describe('modules/status', () => {
  it('getHealth', async function () {
    const health = await getHealth(BEE_DEBUG_URL)

    expect(health.status).to.eql('ok')
    // Matches both versions like 0.5.3-c423a39c, 0.5.3-c423a39c-dirty and 0.5.3
    expect(semver.valid(health.version)).to.not.be.null()()
  })

  it('getReadiness', async function () {
    const isReady = await getReadiness(BEE_DEBUG_URL)

    expect(isReady).to.eql(true)
  })

  it('isSupportedVersion', async function () {
    const isSupported = await isSupportedVersion(BEE_DEBUG_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedExactVersion', async function () {
    const isSupported = await isSupportedExactVersion(BEE_DEBUG_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedMainApiVersion', async function () {
    const isSupported = await isSupportedMainApiVersion(BEE_DEBUG_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedDebugApiVersion', async function () {
    const isSupported = await isSupportedDebugApiVersion(BEE_DEBUG_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedApiVersion', async function () {
    const isSupported = await isSupportedApiVersion(BEE_DEBUG_URL)

    expect(isSupported).to.eql(true)
  })

  it('getVersions', async function () {
    const versions = await getVersions(BEE_DEBUG_URL)

    jestExpect(versions).toEqual(
      jestExpect.objectContaining({
        supportedBeeVersion: jestExpect.any(String),
        supportedBeeApiVersion: jestExpect.any(String),
        supportedBeeDebugApiVersion: jestExpect.any(String),
        beeVersion: jestExpect.any(String),
        beeApiVersion: jestExpect.any(String),
        beeDebugApiVersion: jestExpect.any(String),
      }),
    )

    expect(semver.valid(versions.beeVersion)).to.not.be.null()()
    expect(semver.valid(versions.beeApiVersion)).to.not.be.null()()
    expect(semver.valid(versions.beeDebugApiVersion)).to.not.be.null()()
    expect(semver.valid(versions.supportedBeeApiVersion)).to.not.be.null()()
    expect(semver.valid(versions.supportedBeeVersion)).to.not.be.null()()
    expect(semver.valid(versions.supportedBeeDebugApiVersion)).to.not.be.null()()
  })

  it('SUPPORTED_BEE_* should be same as in package.json', async function () {
    const file = await util.promisify(fs.readFile)(path.join(__dirname, '../../../../package.json'))
    const packageJson = JSON.parse(file.toString())

    expect(SUPPORTED_BEE_VERSION_EXACT).to.eql(packageJson.engines.bee)
    expect(SUPPORTED_API_VERSION).to.eql(packageJson.engines.beeApiVersion)
    expect(SUPPORTED_DEBUG_API_VERSION).to.eql(packageJson.engines.beeDebugApiVersion)
  })
})
