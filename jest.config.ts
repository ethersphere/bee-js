/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */
import type { Config } from '@jest/types'

import { Dates, Types } from 'cafe-utility'

export default async (): Promise<Config.InitialOptions> => {
  Types.asString(process.env.JEST_BEE_URL, { name: 'JEST_BEE_URL' })
  Types.asString(process.env.JEST_BEE_SIGNER, { name: 'JEST_BEE_SIGNER' })
  Types.asHexString(process.env.JEST_MANAGED_BATCH_ID, { name: 'JEST_MANAGED_BATCH_ID', byteLength: 32 })
  Types.asHexString(process.env.JEST_EXTERNAL_BATCH_ID, { name: 'JEST_EXTERNAL_BATCH_ID', byteLength: 32 })
  Types.asString(process.env.JEST_WITHDRAW_ADDRESS, { name: 'JEST_WITHDRAW_ADDRESS' })

  return {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleDirectories: ['node_modules'],
    projects: [
      {
        preset: 'ts-jest',
        displayName: 'node',
        testEnvironment: 'node',
        testRegex: 'test/.*\\.spec\\.ts',
      },
    ] as unknown[] as string[],
    rootDir: 'test',
    testPathIgnorePatterns: ['/node_modules/'],
    testTimeout: Dates.minutes(5),
    verbose: true,
  }
}
