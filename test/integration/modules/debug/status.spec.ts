import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
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

    expect(health.status).to.eql('ok')
    // Matches both versions like 0.5.3-c423a39c, 0.5.3-c423a39c-dirty and 0.5.3
    expect(semver.valid(health.version)).to.not.be.null()
  })

  it('getReadiness', async function () {
    const isReady = await getReadiness(BEE_URL)

    expect(isReady).to.eql(true)
  })

  it('isSupportedVersion', async function () {
    const isSupported = await isSupportedVersion(BEE_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedExactVersion', async function () {
    const isSupported = await isSupportedExactVersion(BEE_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedMainApiVersion', async function () {
    const isSupported = await isSupportedMainApiVersion(BEE_URL)

    expect(isSupported).to.eql(true)
  })

  it('isSupportedApiVersion', async function () {
    const isSupported = await isSupportedApiVersion(BEE_URL)

    expect(isSupported).to.eql(true)
  })

  it('getVersions', async function () {
    const versions = await getVersions(BEE_URL)

    jestExpect(versions).toEqual(
      jestExpect.objectContaining({
        supportedBeeVersion: jestExpect.any(String),
        supportedBeeApiVersion: jestExpect.any(String),
        beeVersion: jestExpect.any(String),
        beeApiVersion: jestExpect.any(String),
      }),
    )

    expect(semver.valid(versions.beeVersion)).to.not.be.null()
    expect(semver.valid(versions.beeApiVersion)).to.not.be.null()
    expect(semver.valid(versions.supportedBeeApiVersion)).to.not.be.null()
    expect(semver.valid(versions.supportedBeeVersion)).to.not.be.null()
  })

  it('SUPPORTED_BEE_* should be same as in package.json', async function () {
    const file = await util.promisify(fs.readFile)(path.join(__dirname, '../../../../package.json'))
    const packageJson = JSON.parse(file.toString())

    expect(SUPPORTED_BEE_VERSION_EXACT).to.eql(packageJson.engines.bee)
    expect(SUPPORTED_API_VERSION).to.eql(packageJson.engines.beeApiVersion)
  })
})
