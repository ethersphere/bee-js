/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */
import type { Config } from '@jest/types'

import { Dates, Types } from 'cafe-utility'

export default async (): Promise<Config.InitialOptions> => {
  Types.asString(process.env.JEST_BEE_FULL_URL, { name: 'JEST_BEE_FULL_URL' })
  Types.asString(process.env.JEST_BEE_LIGHT_URL, { name: 'JEST_BEE_LIGHT_URL' })
  Types.asString(process.env.JEST_BEE_ULTRA_LIGHT_URL, { name: 'JEST_BEE_ULTRA_LIGHT_URL' })
  Types.asHexString(process.env.JEST_FULL_BATCH_ID, { name: 'JEST_FULL_BATCH_ID', byteLength: 32 })
  Types.asHexString(process.env.JEST_LIGHT_BATCH_ID, { name: 'JEST_LIGHT_BATCH_ID', byteLength: 32 })

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
